import { expect, test } from '@playwright/test'
import type * as Scenario from '../grading-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Mock history')
test('filters buyer history by related assignment and preserves filters after detail', async ({
    page,
}) => {
    await page.goto('/app')
    await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const scenario = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof Scenario
        await scenario.createApprovedGradingScenario('woodflow-demo')
    })
    await login(
        page,
        'admin@woodflow.test',
        '/app/reports/buyer-history?mitraId=demo-mitra-01&graderId=demo-grader-01',
    )
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await expectNoOverflow(page)
    await page.locator('tbody a').first().click()
    await expect(page).toHaveURL(/purchase-orders\/demo-po-03/)
    await page.goBack()
    await expect(page.locator('#po-filter-grader')).toHaveValue('demo-grader-01')
    await page.reload()
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await page.locator('#po-filter-grader').selectOption('demo-grader-02')
    await page.getByRole('button', { name: 'Terapkan filter', exact: true }).click()
    await expect(page.locator('tbody tr')).toHaveCount(0)
})
