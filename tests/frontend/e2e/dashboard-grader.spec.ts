import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../grader-dashboard-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grader dashboard mock')
test('isolates assigned production and counts only the active approved revision in the selected month', async ({
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
            origin + '/tests/frontend/grader-dashboard-scenario.ts'
        )) as typeof ScenarioModule
        return scenario.exerciseGraderDashboard()
    })
    expect(result.pending.grader?.production.map((row) => [row.category, row.quantity])).toEqual([
        ['A2', 2],
    ])
    expect(result.own.grader?.production.map((row) => [row.category, row.quantity])).toEqual([
        ['A2', 1],
        ['A3', 1],
    ])
    expect(result.own.grader?.production.map((row) => row.volumeM3).sort()).toEqual(
        result.storedRows.map((row) => row.volumeM3).sort(),
    )
    expect(result.other.grader?.production.map((row) => [row.category, row.quantity])).toEqual([
        ['A1', 2],
    ])
    expect(result.own.grader?.assignments).toEqual({
        count: 1,
        assignedQuantity: 2,
        approvedQuantity: 2,
        remainingQuantity: 0,
        targetPath: '/assignments',
    })
    expect(result.own.metrics).toEqual([])
    expect(result.own.activity).toEqual([])
    expect(result.own.queues).toEqual([])
    expect(result.empty.grader?.production).toEqual([])
    expect(result.invalid).toBe('validation')
    expect(result.revoked.grader).toBeNull()
    await login(page, 'grader1@woodflow.test', '/app?period=2026-09')
    await expect(page.getByText('Kategori A2', { exact: true })).toBeVisible()
    await expect(page.getByText('Kategori A3', { exact: true })).toBeVisible()
    await expect(page.getByText('Kategori A1', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Simulasi settlement, bukan ledger', { exact: true })).toHaveCount(
        0,
    )
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12c/grader-${info.project.name}.png`,
    })
    await page.getByLabel('Bulan produksi').fill('2026-08')
    await page.getByRole('button', { name: 'Terapkan bulan' }).click()
    await expect(
        page.getByText('Belum ada produksi approved pada bulan ini.', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Bulan produksi')).toHaveValue('2026-08')
    await page.getByLabel('Bulan produksi').fill('2026-09')
    await page.getByRole('button', { name: 'Terapkan bulan' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Kategori A3', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Lihat penugasan' }).click()
    await expect(page).toHaveURL(/\/assignments$/)
})
