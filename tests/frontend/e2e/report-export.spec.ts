import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type * as Scenario from '../report-export-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Mock report exports')
test('exports every filtered row and protects persisted snapshots and retries', async ({
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
            origin + '/tests/frontend/report-export-scenario.ts'
        )) as typeof Scenario
        return scenario.exerciseReportExport()
    })
    expect(result.pageTotal).toBe(26)
    expect(result.pageLength).toBe(20)
    expect(result.timeout).toBe('network')
    expect(result.countAfterTimeout).toBe(1)
    expect(result.countAfterRetry).toBe(1)
    expect(result.same).toBe(true)
    expect(result.csv.match(/export-wood-/g)).toHaveLength(26)
    expect(result.csv).toContain("'=SUM(1,2)")
    expect(result.assignedCsv).toBe(result.csv)
    expect(result.foreign).toBe('not-found')
    expect(result.revoked).toBe('forbidden')
    expect(result.priceDenied).toBe('forbidden')
    expect(result.conflict).toBe('conflict')
    expect(result.emptyCsv.trim().split(/\r?\n/)).toHaveLength(1)
    await login(
        page,
        'admin@woodflow.test',
        '/app/reports/production?period=2026-09&timberProductId=export-wood-1',
    )
    await expect(page.getByText('Wood 1', { exact: true }).last()).toBeVisible()
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Ekspor CSV', exact: true }).click()
    const download = await downloadEvent
    expect(download.suggestedFilename()).toBe('production-2026-09.csv')
    const path = await download.path()
    if (!path) throw new Error('Download missing')
    const csv = await readFile(path, 'utf8')
    expect(csv.match(/export-wood-/g)).toHaveLength(1)
    expect(csv).toContain('export-wood-1')
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12e/export-${info.project.name}.png`,
    })
    await page.reload()
    await expect(page.getByLabel('Bulan produksi')).toHaveValue('2026-09')
})
