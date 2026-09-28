import { expect, test } from '@playwright/test'
import type * as Scenario from '../purchase-price-report-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Mock reports')
test('requires both price permissions and shows unavailable historical values honestly', async ({
    page,
}, info) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const scenario = (await import(
            origin + '/tests/frontend/purchase-price-report-scenario.ts'
        )) as typeof Scenario
        return scenario.exercisePurchasePriceReport()
    })
    expect(result.denied).toBe('forbidden')
    expect(result.reportDenied).toBe('forbidden')
    expect(result.result.meta.total).toBe(1)
    expect(result.result.data[0]).toMatchObject({
        unitPrice: null,
        totalAmount: null,
        sourceStatus: 'missing_snapshot',
    })
    await login(page, 'admin@woodflow.test', '/app/reports/purchase-prices?period=2026-09')
    await expect(page.getByText('Belum tersedia', { exact: true })).toHaveCount(2)
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12e/prices-${info.project.name}.png`,
    })
    await page.reload()
    await expect(page.locator('tbody tr')).toHaveCount(1)
})
