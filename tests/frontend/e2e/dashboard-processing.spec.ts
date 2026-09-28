import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../processing-dashboard-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Processing dashboard mock')
test('matches actionable counts to filtered queues and removes work after processing in its owning module', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const scenario = (await import(
            origin + '/tests/frontend/processing-dashboard-scenario.ts'
        )) as typeof ScenarioModule
        return scenario.exerciseProcessingDashboard()
    })
    expect(
        result.before.queues.find((queue) => queue.kind === 'purchase-orders-processing')?.count,
    ).toBe(21)
    expect(result.first.meta.total).toBe(21)
    expect(result.first.data).toHaveLength(1)
    expect(result.second.data[0]?.id).not.toBe(result.first.data[0]?.id)
    expect(result.denied).toBe('forbidden')
    expect(result.deniedWrite).toBe('forbidden')
    expect(result.limited.queues).toEqual([])
    expect(
        result.processed.queues.find((queue) => queue.kind === 'purchase-orders-processing')?.count,
    ).toBe(20)
    expect(result.processed.queues.find((queue) => queue.kind === 'orders-processing')?.count).toBe(
        1,
    )
    expect(result.closed.meta.total).toBe(0)
    expect(result.filtered.meta.total).toBe(1)
    await login(page, 'maker@woodflow.test')
    await expect(page.getByTestId('queue-orders-processing')).toContainText('1')
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12b/processing-${info.project.name}.png`,
    })
    await page.getByTestId('queue-purchase-orders-processing').click()
    await expect(page.getByText('20 pekerjaan', { exact: true })).toBeVisible()
    await page
        .getByLabel('Cari nomor PO atau transaksi')
        .fill(result.second.data[0]?.purchaseOrderNumber ?? '')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByText('1 pekerjaan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('1 pekerjaan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke dashboard' }).click()
    await page.getByTestId('queue-invoices-processing').focus()
    await page.keyboard.press('Enter')
    await page.locator(`a[href="/app/invoices/${result.invoiceId}"]`).click()
    await page.getByRole('button', { name: 'Terbitkan invoice', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Terbitkan invoice', exact: true })).toHaveCount(
        0,
    )
    await page.goto('/app/dashboard/queue?kind=invoices-processing')
    await expect(page.getByText('Tidak ada pekerjaan yang sesuai.', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'user@woodflow.test')
    await expect(page.getByTestId('queue-orders-processing')).toHaveCount(0)
    await page.goto('/app/dashboard/queue?kind=orders-processing')
    await expect(page.getByRole('heading', { name: 'Akses tidak diizinkan' })).toBeVisible()
})
