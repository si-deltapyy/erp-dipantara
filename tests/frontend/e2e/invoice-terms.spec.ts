import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../grading-scenario'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/invoice-repository'
import type * as DocumentsModule from '../../../resources/js/src/api/mocks/persistence/document-repository'
import type * as AccountsModule from '../../../resources/js/src/api/mocks/persistence/bank-account-repository'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Invoice terms mock')
test('persists Buyer and Mitra terms, issues PDF once and enforces scoped lookup and stale writes', async ({
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
        const { DocumentRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/document-repository.ts'
        )) as typeof DocumentsModule
        const { BankAccountRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/bank-account-repository.ts'
        )) as typeof AccountsModule
        const { options, maker, grader, generation, signal } =
            await createApprovedGradingScenario('woodflow-demo')
        const invoices = new InvoiceRepository(options)
        const input = {
            purchaseOrderId: 'demo-po-03',
            mitraId: null,
            direction: 'receivable' as const,
            kind: 'down_payment' as const,
            invoiceDate: '2026-09-28',
            terms: [
                { label: 'Buyer DP', amount: '1000000.10', dueDate: null },
                { label: 'Buyer DP 2', amount: '700000.20', dueDate: '2026-10-01' },
            ],
            notes: null,
        }
        const draft = await invoices.mutate(
            maker,
            { action: 'create', input, key: 'buyer' },
            generation,
            signal,
        )
        const issued = await invoices.mutate(
            maker,
            {
                action: 'issue',
                id: draft.id,
                input: { version: draft.version, revisionNumber: draft.revisionNumber },
                key: 'issue',
            },
            generation,
            signal,
        )
        const replay = await invoices.mutate(
            maker,
            {
                action: 'issue',
                id: draft.id,
                input: { version: draft.version, revisionNumber: draft.revisionNumber },
                key: 'issue',
            },
            generation,
            signal,
        )
        const payable = await invoices.mutate(
            maker,
            {
                action: 'create',
                input: {
                    ...input,
                    direction: 'payable',
                    mitraId: 'demo-mitra-01',
                    terms: [{ label: 'Mitra DP', amount: '123.45', dueDate: null }],
                },
                key: 'mitra',
            },
            generation,
            signal,
        )
        const failures: string[] = []
        const owner = {
            ...grader,
            id: 'user-demo',
            permissions: [
                'invoices.read.own',
                'documents.download.own',
                'bank-accounts.lookup.own',
            ],
        }
        for (const run of [
            () =>
                invoices.mutate(
                    maker,
                    {
                        action: 'update',
                        id: issued.id,
                        input: {
                            ...input,
                            version: issued.version,
                            revisionNumber: issued.revisionNumber,
                        },
                        key: 'locked',
                    },
                    generation,
                    signal,
                ),
            () =>
                invoices.mutate(
                    maker,
                    {
                        action: 'create',
                        input: { ...input, direction: 'payable' },
                        key: 'missing-mitra',
                    },
                    generation,
                    signal,
                ),
            () => invoices.get(grader, issued.id, signal),
            () => invoices.get({ ...owner, id: 'another-owner' }, issued.id, signal),
            () =>
                new BankAccountRepository(options).list(
                    { ...owner, id: 'another-owner' },
                    { page: 1, perPage: 20, search: '', sort: 'createdAt', invoiceId: issued.id },
                    signal,
                    true,
                ),
        ]) {
            try {
                await run()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        if (!issued.documentId) throw new Error('Missing PDF')
        const pdf = await new DocumentRepository(options).download(owner, issued.documentId, signal)
        const accounts = await new BankAccountRepository(options).list(
            owner,
            { page: 1, perPage: 100, search: '', sort: 'createdAt', invoiceId: issued.id },
            signal,
            true,
        )
        return {
            id: issued.id,
            total: issued.totalAmount,
            outstanding: issued.outstandingAmount,
            terms: issued.terms.length,
            payableTotal: payable.totalAmount,
            replay: replay.documentId === issued.documentId,
            pdf: (await pdf.blob.text()).startsWith('%PDF-1.4'),
            accounts: accounts.data.every(
                (account) => account.ownerType === 'company' || account.ownerId === 'demo-buyer-01',
            ),
            failures,
        }
    })
    expect(result).toMatchObject({
        total: '1700000.30',
        outstanding: '1700000.30',
        terms: 2,
        payableTotal: '123.45',
        replay: true,
        pdf: true,
        accounts: true,
        failures: ['conflict', 'validation', 'forbidden', 'not-found', 'not-found'],
    })
    await login(page, 'user@woodflow.test', '/app/invoices/' + result.id)
    await expect(page.getByText('Buyer DP', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit invoice', exact: true })).toHaveCount(0)
    await expectNoOverflow(page)
})
test('creates, edits and issues an invoice with a downloadable PDF through the UI', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', '/app/invoices/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByLabel('Nama termin', { exact: true }).fill('DP UI')
    await page.getByLabel('Nominal termin', { exact: true }).fill('1000000.00')
    await page.getByRole('button', { name: 'Tambah termin', exact: true }).click()
    await page.getByLabel('Nama termin', { exact: true }).nth(1).fill('DP berikutnya')
    await page.getByLabel('Nominal termin', { exact: true }).nth(1).fill('700000.00')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail invoice', exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole('link', { name: 'Edit invoice', exact: true }).click()
    await page.getByLabel('Catatan', { exact: true }).fill('Catatan simulasi')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('button', { name: 'Terbitkan invoice', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diterbitkan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Catatan simulasi', { exact: true })).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Unduh invoice', exact: true }).click()
    expect((await download).suggestedFilename()).toMatch(/^invoice-.*-v1\.pdf$/)
    await page.getByRole('button', { name: 'Pratinjau invoice', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('invoice-terms.png'), fullPage: true })
})
