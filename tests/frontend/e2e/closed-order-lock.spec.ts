import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../closed-order-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Closed order mock')
test('blocks every closed parent write while preserving scoped history and document downloads', async ({
    page,
}) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { exerciseClosedOrderLock } = (await import(
            origin + '/tests/frontend/closed-order-scenario.ts'
        )) as typeof ScenarioModule
        return exerciseClosedOrderLock()
    })
    expect(result.outcomes).toHaveLength(31)
    expect(result.outcomes.filter((outcome) => outcome.kind !== 'conflict')).toEqual([])
    expect(result.auditAfter).toBe(result.auditBefore)
    expect(result.po.status).toBe('closed')
    expect(result.invoice.allowedActions).toEqual([])
    expect(result.grading.allowedActions).toEqual([])
    expect(result.assignment.allowedActions).toEqual([])
    expect(result.payment.status).toBe('approved')
    expect(result.shipment.status).toBe('received')
    expect(result.documentSize).toBeGreaterThan(0)
})
test('rejects an invoice revision opened before another tab closes the PO and locks direct edit routes', async ({
    page,
    context,
}) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const ids = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { prepareClosedOrder } = (await import(
            origin + '/tests/frontend/closed-order-scenario.ts'
        )) as typeof ScenarioModule
        const { closing, invoice, context } = await prepareClosedOrder()
        return {
            closing: closing.id,
            invoice: invoice.id,
            po: context.po.id,
            grading: context.approved.id,
            assignment: context.assignment.id,
        }
    })
    await login(page, 'admin@woodflow.test', `/app/invoices/${ids.invoice}/revise`)
    await page.getByLabel('Alasan revisi', { exact: true }).fill('Late correction')
    const other = await context.newPage()
    await other.goto('/app')
    await other.evaluate(async (id) => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { approveClosingFromAnotherTab } = (await import(
            origin + '/tests/frontend/closed-order-scenario.ts'
        )) as typeof ScenarioModule
        await approveClosingFromAnotherTab(id)
    }, ids.closing)
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Status atau versi telah berubah')
    await expect(page.getByLabel('Alasan revisi', { exact: true })).toHaveValue('Late correction')
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('Invoice tidak dapat diedit')
    await page.goto(`/app/invoices/${ids.invoice}`)
    await expect(page.getByRole('link', { name: 'Revisi invoice', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Catat pembayaran', exact: true })).toHaveCount(0)
    await page.goto(`/app/gradings/${ids.grading}/revise`)
    await expect(page.getByRole('alert')).toContainText('Grading')
    await page.goto(`/app/purchase-orders/${ids.po}`)
    await expect(page.getByText('PO telah ditutup', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await other.close()
})
