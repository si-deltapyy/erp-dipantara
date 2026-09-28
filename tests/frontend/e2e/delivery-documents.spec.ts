import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../delivery-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Delivery documents mock')
test.use({ actionTimeout: 15000 })

test('requires both SAKR directions, locks allocation after dispatch and receives once', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createDeliveryScenario } = (await import(
            origin + '/tests/frontend/delivery-scenario.ts'
        )) as typeof ScenarioModule
        const {
            deliveries,
            documents,
            delivery,
            input,
            query,
            maker,
            grader,
            signal,
            generation,
            attachDocuments,
        } = await createDeliveryScenario()
        const failures: string[] = []
        const fail = async (run: () => Promise<unknown>) => {
            try {
                await run()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await fail(() =>
            deliveries.mutate(
                maker,
                {
                    action: 'dispatch',
                    id: delivery.id,
                    input: { version: delivery.version },
                    key: 'incomplete',
                },
                generation,
                signal,
            ),
        )
        const ready = await attachDocuments()
        const sent = await deliveries.mutate(
            maker,
            {
                action: 'dispatch',
                id: ready.id,
                input: { version: ready.version },
                key: 'dispatch',
            },
            generation,
            signal,
        )
        const replay = await deliveries.mutate(
            maker,
            {
                action: 'dispatch',
                id: ready.id,
                input: { version: ready.version },
                key: 'dispatch',
            },
            generation,
            signal,
        )
        const available = await deliveries.availability(maker, query, signal)
        await fail(() =>
            deliveries.mutate(
                maker,
                {
                    action: 'update',
                    id: sent.id,
                    input: {
                        ...input,
                        version: sent.version,
                        availabilityToken: available.data[0]?.snapshotToken ?? '',
                    },
                    key: 'locked',
                },
                generation,
                signal,
            ),
        )
        const file = new File(['%PDF-1.4\nnew'], 'new.pdf', { type: 'application/pdf' })
        await fail(() =>
            documents.upload(
                maker,
                { parentType: 'delivery', parentId: sent.id, purpose: 'sakr', file },
                'locked-upload',
                generation,
                signal,
            ),
        )
        await fail(() =>
            documents.download(
                { ...grader, id: 'grader-two' },
                ready.documents[0]?.documentId ?? '',
                signal,
            ),
        )
        const received = await deliveries.mutate(
            maker,
            { action: 'receive', id: sent.id, input: { version: sent.version }, key: 'receive' },
            generation,
            signal,
        )
        await fail(() =>
            deliveries.mutate(
                maker,
                {
                    action: 'receive',
                    id: sent.id,
                    input: { version: received.version },
                    key: 'receive-again',
                },
                generation,
                signal,
            ),
        )
        return {
            failures,
            sent: sent.status,
            replayVersion: replay.version,
            sentVersion: sent.version,
            received: received.status,
            stock: available.data[0]?.shippedQuantity,
            files: (
                await documents.list(maker, { parentType: 'delivery', parentId: sent.id }, signal)
            ).length,
        }
    })
    expect(result.failures).toEqual([
        'validation',
        'conflict',
        'forbidden',
        'not-found',
        'conflict',
    ])
    expect(result.sent).toBe('dispatched')
    expect(result.replayVersion).toBe(result.sentVersion)
    expect(result.received).toBe('received')
    expect(result.stock).toBe(2)
    expect(result.files).toBe(2)
})

test('uploads PDF files, saves SAKR metadata and confirms dispatch and receipt in the browser', async ({
    page,
}, info) => {
    await page.goto('/app')
    const id = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createDeliveryScenario } = (await import(
            origin + '/tests/frontend/delivery-scenario.ts'
        )) as typeof ScenarioModule
        return (await createDeliveryScenario('woodflow-demo')).delivery.id
    })
    await login(page, 'maker@woodflow.test', '/app/deliveries/' + id)
    await expect(page.getByRole('button', { name: 'Kirim pengiriman', exact: true })).toHaveCount(0)
    for (const name of ['farmer.pdf', 'buyer.pdf']) {
        await page.getByLabel('Pilih PDF SAKR').setInputFiles({
            name,
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4\nSynthetic SAKR'),
        })
        await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
        await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    }
    const downloading = page.waitForEvent('download')
    await page
        .getByRole('listitem')
        .filter({ hasText: 'farmer.pdf' })
        .getByRole('button', { name: 'Unduh dokumen', exact: true })
        .click()
    expect((await downloading).suggestedFilename()).toBe('farmer.pdf')
    await page.getByRole('button', { name: 'Pratinjau dokumen', exact: true }).first().click()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Cetak PDF' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Edit pengiriman', exact: true }).click()
    for (const [direction, label, file] of [
        ['farmer_to_company', 'Petani → Dipantara', 'farmer.pdf'],
        ['company_to_buyer', 'Dipantara → Buyer', 'buyer.pdf'],
    ] as const) {
        const group = page.getByRole('group', { name: label, exact: true })
        await group.getByLabel('Berkas SAKR', { exact: true }).selectOption({ label: file })
        await group.getByLabel('Nomor SAKR', { exact: true }).fill('DEMO-' + direction)
        await group.getByLabel('Tanggal SAKR', { exact: true }).fill('2026-09-28')
    }
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('button', { name: 'Kirim pengiriman', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Dikirim', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit pengiriman', exact: true })).toHaveCount(0)
    await page.reload()
    await page.getByRole('button', { name: 'Tandai diterima', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diterima', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('delivery-documents.png'), fullPage: true })
})
