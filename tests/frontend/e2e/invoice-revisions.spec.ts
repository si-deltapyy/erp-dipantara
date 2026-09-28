import { expect, test } from '@playwright/test'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/invoice-repository'
import type * as ScenarioModule from '../grading-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Invoice revisions mock')
test('keeps issued value active until revision issue, guards approved credits and preserves PDF history', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createApprovedGradingScenario } = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof ScenarioModule
        const { InvoiceRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/invoice-repository.ts'
        )) as typeof RepositoryModule
        const { options, maker, generation, signal } =
            await createApprovedGradingScenario('woodflow-demo')
        let credit = '0.00'
        const repository = new InvoiceRepository(options, async () => credit)
        const input = {
            purchaseOrderId: 'demo-po-03',
            mitraId: null,
            direction: 'receivable' as const,
            kind: 'settlement' as const,
            invoiceDate: '2026-09-28',
            terms: [{ label: 'Pelunasan awal', amount: '1000000.00', dueDate: null }],
            notes: null,
        }
        const draft = await repository.mutate(
            maker,
            { action: 'create', input, key: 'settlement' },
            generation,
            signal,
        )
        const issued = await repository.mutate(
            maker,
            {
                action: 'issue',
                id: draft.id,
                input: { version: draft.version, revisionNumber: 1 },
                key: 'issue',
            },
            generation,
            signal,
        )
        credit = '100000.00'
        const failures: string[] = []
        const fail = async (run: () => Promise<unknown>) => {
            try {
                await run()
                failures.push('unexpected')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await fail(() =>
            repository.mutate(
                maker,
                {
                    action: 'revise',
                    id: issued.id,
                    input: {
                        version: issued.version,
                        reason: 'Below approved credit',
                        terms: [{ label: 'Invalid', amount: '99999.99', dueDate: null }],
                    },
                    key: 'below-credit',
                },
                generation,
                signal,
            ),
        )
        const revisionInput = {
            version: issued.version,
            reason: 'Koreksi jumlah',
            terms: [{ label: 'Pelunasan koreksi', amount: '700000.00', dueDate: null }],
        }
        const revised = await repository.mutate(
            maker,
            { action: 'revise', id: issued.id, input: revisionInput, key: 'revision' },
            generation,
            signal,
        )
        const replay = await repository.mutate(
            maker,
            { action: 'revise', id: issued.id, input: revisionInput, key: 'revision' },
            generation,
            signal,
        )
        const beforeIssue = await repository.versions(maker, issued.id, signal)
        credit = '800000.00'
        await fail(() =>
            repository.mutate(
                maker,
                {
                    action: 'issue',
                    id: revised.id,
                    input: { version: revised.version, revisionNumber: 2 },
                    key: 'over-credit',
                },
                generation,
                signal,
            ),
        )
        const afterFailedIssue = await repository.get(maker, issued.id, signal)
        credit = '100000.00'
        const final = await repository.mutate(
            maker,
            {
                action: 'issue',
                id: revised.id,
                input: { version: revised.version, revisionNumber: 2 },
                key: 'issue-revision',
            },
            generation,
            signal,
        )
        const versions = await repository.versions(maker, issued.id, signal)
        return {
            id: issued.id,
            stable: revised.id === issued.id && final.id === issued.id,
            replay: replay.version === revised.version,
            oldTotal: revised.issuedTotalAmount,
            draftTotal: revised.totalAmount,
            draftOutstanding: revised.outstandingAmount,
            activeBefore: beforeIssue.find((version) => version.revisionNumber === 1)?.status,
            failedStatus: afterFailedIssue.status,
            failedActive: afterFailedIssue.issuedTotalAmount,
            finalOutstanding: final.outstandingAmount,
            statuses: versions.map((version) => version.status),
            oldPdf:
                versions.find((version) => version.revisionNumber === 1)?.documentId ===
                issued.documentId,
            differentPdf: final.documentId !== issued.documentId,
            failures,
        }
    })
    expect(result).toMatchObject({
        stable: true,
        replay: true,
        oldTotal: '1000000.00',
        draftTotal: '700000.00',
        draftOutstanding: '900000.00',
        activeBefore: 'issued',
        failedStatus: 'draft',
        failedActive: '1000000.00',
        finalOutstanding: '600000.00',
        statuses: ['issued', 'superseded'],
        oldPdf: true,
        differentPdf: true,
        failures: ['conflict', 'conflict'],
    })
    await login(page, 'maker@woodflow.test', '/app/invoices/' + result.id)
    await page.getByRole('link', { name: 'Revisi invoice', exact: true }).click()
    await page.getByLabel('Nominal termin', { exact: true }).fill('800000.00')
    await page.getByLabel('Alasan revisi', { exact: true }).fill('Revisi melalui UI')
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByText(/Versi issued aktif: 2/)).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: 'Terbitkan invoice', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByLabel('Versi invoice', { exact: true })).toHaveValue('3')
    await page.getByLabel('Versi invoice', { exact: true }).selectOption('1')
    const history = page.getByRole('heading', { name: 'Riwayat versi invoice' }).locator('..')
    await expect(history.getByText('Total tagihan: Rp 1.000.000,00', { exact: true })).toBeVisible()
    const download = page.waitForEvent('download')
    await history.getByRole('button', { name: 'Unduh invoice', exact: true }).click()
    expect((await download).suggestedFilename()).toMatch(/-v1\.pdf$/)
    await expectNoOverflow(page)
})
