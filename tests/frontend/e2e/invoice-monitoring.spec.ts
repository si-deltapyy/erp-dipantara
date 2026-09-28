import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/invoice-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Invoice monitoring mock')
test('scopes balances and filtered invoice links to the PO owner across reload', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { DemoRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { InvoiceRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/invoice-repository.ts'
        )) as typeof RepositoryModule
        const { sessionFixtures } = (await import(
            origin + '/resources/js/src/api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        await new DemoRepository().initialize()
        const owner = sessionFixtures.find((actor) => actor.id === 'user-demo') ?? null
        const other = sessionFixtures.find((actor) => actor.id === 'multiple-demo') ?? null
        const api = new InvoiceRepository({}, async () => '25000.00')
        const signal = new AbortController().signal
        const summary = await api.settlement(owner, 'synthetic-payable-01', signal)
        let denied = ''
        try {
            await api.settlement(other, 'synthetic-payable-01', signal)
        } catch (cause) {
            denied = (cause as { kind: string }).kind
        }
        const list = await api.list(
            owner,
            { page: 1, perPage: 1, search: '', sort: 'createdAt', purchaseOrderId: 'demo-po-26' },
            signal,
        )
        return {
            outstanding: summary.outstandingAmount,
            overdue: summary.overdueAmount,
            denied,
            hiddenTotal: list.meta.total,
        }
    })
    expect(result).toEqual({
        outstanding: '75000.00',
        overdue: '0.00',
        denied: 'not-found',
        hiddenTotal: 0,
    })
    await login(page, 'user@woodflow.test', '/app/purchase-orders/demo-po-03')
    await page
        .locator('section.panel')
        .filter({
            has: page.getByRole('heading', { name: 'Ringkasan settlement PO', exact: true }),
        })
        .getByRole('link', { name: 'Pantau invoice', exact: true })
        .click()
    await page.getByLabel('Arah tagihan', { exact: true }).selectOption('payable')
    await page.getByLabel('Status', { exact: true }).selectOption('issued')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page).toHaveURL(/purchaseOrderId=demo-po-03/)
    await page.reload()
    await expect(page.getByLabel('Arah tagihan', { exact: true })).toHaveValue('payable')
    await expect(page.getByText('1 invoice', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /Buka invoice/ }).click()
    await expect(
        page.getByRole('heading', { name: 'Saldo termin issued aktif', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Revisi invoice', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Terbitkan invoice', exact: true })).toHaveCount(
        0,
    )
    await expectNoOverflow(page)
    await page.goto('/app/invoices/demo-invoice-buyer-two')
    await expect(
        page.getByText('Invoice tidak ditemukan atau tidak dapat diakses.', { exact: true }),
    ).toBeVisible()
})
