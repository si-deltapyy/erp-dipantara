import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment processing mock')
test('Maker processes owner payments and invoice and PO links preserve scoped history filters', async ({
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
        const { payments, documents, owner, maker, generation, signal, input, invoice } =
            await createPaymentScenario('woodflow-demo')
        const own = await payments.mutate(
            owner,
            { action: 'create', input, key: 'owner' },
            generation,
            signal,
        )
        const proof = await documents.upload(
            maker,
            {
                parentType: 'payment',
                parentId: null,
                purpose: 'payment_proof',
                file: new File(['%PDF-1.4\nMaker\n%%EOF'], 'maker.pdf', {
                    type: 'application/pdf',
                }),
            },
            'maker-proof',
            generation,
            signal,
        )
        await payments.mutate(
            maker,
            {
                action: 'create',
                input: {
                    ...input,
                    cashAmount: '700000.00',
                    withholdingAmount: '0.00',
                    proofDocumentId: proof.id,
                },
                key: 'maker',
            },
            generation,
            signal,
        )
        const all = await payments.list(
            maker,
            { page: 1, perPage: 1, search: '', sort: 'createdAt', invoiceId: invoice.id },
            signal,
        )
        const ownList = await payments.list(
            owner,
            { page: 1, perPage: 20, search: '', sort: 'createdAt' },
            signal,
        )
        return {
            id: own.id,
            invoiceId: invoice.id,
            count: all.meta.total,
            pageSize: all.data.length,
            ownerCount: ownList.meta.total,
        }
    })
    expect(result).toMatchObject({ count: 2, pageSize: 1, ownerCount: 2 })
    await login(page, 'maker@woodflow.test', '/app/payments/' + result.id)
    await page.getByRole('link', { name: 'Edit pembayaran', exact: true }).click()
    await page.getByLabel('Catatan', { exact: true }).fill('Diperiksa Maker')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Diperiksa Maker', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Ajukan pembayaran', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.goto('/app/invoices/' + result.invoiceId)
    await page.getByRole('link', { name: 'Pantau pembayaran', exact: true }).click()
    await expect(page).toHaveURL(/invoiceId=/)
    await expect(page.getByText('2 pembayaran', { exact: true })).toBeVisible()
    await page.getByLabel('Status', { exact: true }).selectOption('submitted')
    await expect(page.getByText('1 pembayaran', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('submitted')
    await page.getByRole('button', { name: 'Hapus filter', exact: true }).click()
    await expect(page.getByText('2 pembayaran', { exact: true })).toBeVisible()
    await page.goto('/app/purchase-orders/demo-po-03')
    await page.getByRole('link', { name: 'Pantau pembayaran', exact: true }).click()
    await expect(page).toHaveURL(/purchaseOrderId=demo-po-03/)
    await expectNoOverflow(page)
})
