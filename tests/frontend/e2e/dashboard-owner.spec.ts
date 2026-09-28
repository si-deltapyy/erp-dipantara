import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../owner-dashboard-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Owner dashboard mock')
test('shows owner transactions created by Maker and applies scope before the recent activity limit', async ({
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
            origin + '/tests/frontend/owner-dashboard-scenario.ts'
        )) as typeof ScenarioModule
        return scenario.exerciseOwnerDashboard()
    })
    expect(result.activity).toHaveLength(4)
    expect(result.activity.map((record) => record.resource).sort()).toEqual([
        'invoices',
        'invoices',
        'payments',
        'purchase-orders',
    ])
    expect(result.activity.some((record) => record.id === result.invoiceId)).toBe(true)
    expect(result.adminActivity).toEqual([])
    expect(result.graderActivity).toEqual([])
    expect(result.revoked.activity.map((record) => record.resource)).toEqual(['purchase-orders'])
    expect(result.revoked.metrics.some((metric) => metric.unit === 'IDR')).toBe(false)
    expect(result.other.activity).toHaveLength(10)
    expect(
        result.other.activity.every((record) =>
            record.purchaseOrderNumber.startsWith('DASHBOARD-'),
        ),
    ).toBe(true)
    await login(page, 'user@woodflow.test')
    const panel = page.getByRole('region', { name: 'Aktivitas transaksi saya' })
    await expect(panel.getByRole('listitem')).toHaveCount(4)
    await expect(panel.getByText('CHAIN-', { exact: false }).first()).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12b/owner-${info.project.name}.png`,
    })
    const link = panel.locator(`a[href="/app/invoices/${result.invoiceId}"]`)
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp('/invoices/' + result.invoiceId))
    await page.goBack()
    await expect(panel.getByRole('listitem')).toHaveCount(4)
    await page.reload()
    await expect(panel.getByRole('listitem')).toHaveCount(4)
})
