import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment entry mock')
test('binds proofs atomically, scopes records and keeps draft and submitted credits out of settlement', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        const { payments, documents, invoices, owner, other, generation, signal, input, invoice } =
            await createPaymentScenario()
        const failures: string[] = []
        async function fail(run: () => Promise<unknown>): Promise<void> {
            try {
                await run()
                failures.push('unexpected')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await fail(() =>
            payments.mutate(
                owner,
                {
                    action: 'create',
                    input: { ...input, proofDocumentId: 'missing' },
                    key: 'bad-proof',
                },
                generation,
                signal,
            ),
        )
        const query = { page: 1, perPage: 20, search: '', sort: 'createdAt' as const }
        const empty = await payments.list(owner, query, signal)
        const draft = await payments.mutate(
            owner,
            { action: 'create', input, key: 'draft' },
            generation,
            signal,
        )
        const replay = await payments.mutate(
            owner,
            { action: 'create', input, key: 'draft' },
            generation,
            signal,
        )
        await fail(() => payments.get(other, draft.id, signal))
        await fail(() => documents.download(other, input.proofDocumentId, signal))
        await fail(() =>
            payments.mutate(
                owner,
                { action: 'create', input, key: 'reuse-proof' },
                generation,
                signal,
            ),
        )
        await fail(() =>
            payments.mutate(
                owner,
                { action: 'update', id: draft.id, input: { ...input, version: 999 }, key: 'stale' },
                generation,
                signal,
            ),
        )
        const updated = await payments.mutate(
            owner,
            {
                action: 'update',
                id: draft.id,
                input: { ...input, version: draft.version, roundingAdjustment: '-1.00' },
                key: 'update',
            },
            generation,
            signal,
        )
        const submitted = await payments.mutate(
            owner,
            { action: 'submit', id: draft.id, input: { version: updated.version }, key: 'submit' },
            generation,
            signal,
        )
        const submittedReplay = await payments.mutate(
            owner,
            { action: 'submit', id: draft.id, input: { version: updated.version }, key: 'submit' },
            generation,
            signal,
        )
        const settlement = await invoices.settlement(owner, invoice.id, signal)
        const visible = await payments.list(other, query, signal)
        const bound = await documents.list(
            owner,
            { parentType: 'payment', parentId: draft.id },
            signal,
        )
        return {
            rollback: empty.meta.total,
            same: replay.id === draft.id,
            version: submittedReplay.version === submitted.version,
            credit: submitted.creditAmount,
            status: submitted.status,
            settlement,
            hidden: visible.meta.total,
            bound: bound.length,
            failures,
        }
    })
    expect(result).toMatchObject({
        rollback: 0,
        same: true,
        version: true,
        credit: '999999.00',
        status: 'submitted',
        settlement: { approvedCredit: '0.00', outstandingAmount: '1700000.00' },
        hidden: 0,
        bound: 1,
        failures: ['validation', 'not-found', 'not-found', 'not-found', 'conflict'],
    })
})
test('owner creates, edits, reloads and submits payment with proof through the UI', async ({
    page,
}, testInfo) => {
    await page.goto('/app')
    const invoiceId = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        return (await createPaymentScenario('woodflow-demo')).invoice.id
    })
    await login(page, 'user@woodflow.test', '/app/invoices/' + invoiceId)
    await page.getByRole('link', { name: 'Catat pembayaran', exact: true }).click()
    await expect(page.getByLabel('Rekening sumber', { exact: true }).locator('option')).toHaveCount(
        2,
    )
    await page.getByLabel('Rekening sumber', { exact: true }).selectOption('demo-bank-account-02')
    await page.getByLabel('Rekening tujuan', { exact: true }).selectOption('demo-bank-account-01')
    await page.getByLabel('Nominal cash', { exact: true }).fill('950000.00')
    await page.getByLabel('Withholding', { exact: true }).fill('50000.00')
    await page.getByLabel('Pilih bukti pembayaran', { exact: true }).setInputFiles({
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\nDemo proof\n%%EOF'),
    })
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Bukti sudah tersedia.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).press('Enter')
    await expect(
        page.getByRole('heading', { name: 'Detail pembayaran', exact: true }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Edit pembayaran', exact: true }).click()
    await page.getByLabel('Adjustment', { exact: true }).fill('-1.00')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Rp 999.999,00', { exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: 'Ajukan pembayaran', exact: true }).press('Enter')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Ajukan pembayaran', exact: true }).press('Enter')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit pembayaran', exact: true })).toHaveCount(0)
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Unduh bukti', exact: true }).click()
    expect((await download).suggestedFilename()).toBe('proof.pdf')
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        path: '../docs/evidence/sprint-10a/payment-' + testInfo.project.name + '.png',
        fullPage: true,
    })
})
