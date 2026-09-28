import { expect, test } from '@playwright/test'
import type * as Scenario from '../report-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Mock reports')
test('reads scoped production with persistent filters and distinct empty state', async ({
    page,
}, info) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const scenario = (await import(
            origin + '/tests/frontend/report-scenario.ts'
        )) as typeof Scenario
        return scenario.exerciseProductionReport()
    })
    expect(result.all.data[0]?.quantity).toBe(4)
    expect(result.own.data[0]?.quantity).toBe(2)
    expect(result.foreign.meta.total).toBe(0)
    expect(result.empty.meta.total).toBe(0)
    expect(result.denied).toBe('forbidden')
    await login(page, 'admin@woodflow.test', '/app/reports/production?period=2026-09')
    await expect(page.getByText('4 batang', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12e/production-${info.project.name}.png`,
    })
    await page.getByLabel('Bulan produksi').fill('2026-08')
    await page.getByRole('button', { name: 'Terapkan filter', exact: true }).click()
    await expect(
        page.getByText('Belum ada produksi approved pada bulan ini.', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Bulan produksi')).toHaveValue('2026-08')
})
