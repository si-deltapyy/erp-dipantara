import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../dashboard-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Dashboard mock')
test('aggregates scoped records beyond one page and links active issued balances through revisions', async ({
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
            origin + '/tests/frontend/dashboard-scenario.ts'
        )) as typeof ScenarioModule
        return scenario.exerciseDashboard()
    })
    const metric = (key: string) => result.after.metrics.find((entry) => entry.key === key)?.value
    expect(result.before.metrics.find((entry) => entry.key === 'buyer-outstanding')?.value).toBe(
        '1700000.00',
    )
    expect(metric('buyer-outstanding')).toBe('1000000.00')
    expect(metric('mitra-outstanding')).toBe('800000.00')
    expect(metric('active-purchase-orders')).toBe(22)
    expect(metric('active-purchase-orders')).toBe(result.poTotal)
    expect(metric('dispatched-deliveries')).toBe(result.deliveryTotal)
    expect(
        result.ownerView.metrics.find((entry) => entry.key === 'active-purchase-orders')?.value,
    ).toBe(1)
    expect(result.assigned.metrics.some((entry) => entry.unit === 'IDR')).toBe(false)
    expect(result.narrowed.metrics).toEqual([])
    expect(result.forbidden).toBe('forbidden')
    expect(result.empty.metrics.every((entry) => entry.value === 0 || entry.value === '0.00')).toBe(
        true,
    )
    expect(result.filtered.meta.total).toBe(1)
    expect(result.filtered.data[0]?.status).toBe('draft')
    expect(result.outstanding).toBe(metric('buyer-outstanding'))
    await login(page, 'admin@woodflow.test', '/app')
    await expect(page.getByTestId('metric-active-purchase-orders')).toContainText('22')
    await expect(page.getByTestId('metric-buyer-outstanding')).toContainText('1.000.000')
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12a/dashboard-${info.project.name}.png`,
    })
    await page.getByTestId('metric-buyer-outstanding').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/invoices\?direction=receivable&balance=outstanding/)
    await expect(page.getByLabel('Saldo', { exact: true })).toHaveValue('outstanding')
    await expect(page.getByText('Sisa: Rp 1.000.000,00', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Saldo', { exact: true })).toHaveValue('outstanding')
    await expectNoOverflow(page)
})
