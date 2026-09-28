import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
import { actors, captureEvidence, collectPageErrors, seedOrders, switchActor } from './uat-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Cross-role acceptance mock')
const production = '/app/reports/production?period=2026-09'
const orders = [
    {
        ownerId: 'user-demo',
        number: 'UAT-REPORT-01',
        quantity: 2,
        graderNumber: 1,
        shipments: [2],
    },
    {
        ownerId: 'multiple-demo',
        number: 'UAT-REPORT-02',
        quantity: 2,
        graderNumber: 2,
        shipments: [2],
    },
] as const
async function exportRows(page: Page): Promise<string[]> {
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Ekspor CSV', exact: true }).click()
    const download = await downloading
    expect(download.suggestedFilename()).toBe('production-2026-09.csv')
    const path = await download.path()
    if (!path) throw new Error('Download missing')
    return (await readFile(path, 'utf8')).trim().split(/\r?\n/).slice(1)
}
async function expectForbidden(page: Page, paths: readonly string[]): Promise<void> {
    for (const path of paths) {
        await page.goto(path)
        await expect(page).toHaveURL(/forbidden/)
    }
}
async function expectActivity(page: Page, visible: string, hidden: string): Promise<void> {
    const panel = page.getByRole('region', { name: 'Aktivitas transaksi saya' })
    await expect(panel.getByText(visible, { exact: false }).first()).toBeVisible()
    await expect(panel.getByText(hidden, { exact: false })).toHaveCount(0)
}
test('shows each role its own dashboard and exports the filtered production report', async ({
    page,
}, info) => {
    test.setTimeout(300000)
    const errors = collectPageErrors(page)
    await seedOrders(page, orders)
    await test.step('admin reads all production and exports the filtered rows', async () => {
        await login(page, actors.admin, '/app')
        await expect(page.getByTestId('metric-active-purchase-orders')).toBeVisible()
        await page.goto(production)
        await expect(page.getByText('4 batang', { exact: true })).toBeVisible()
        expect(await exportRows(page)).toHaveLength(1)
        await page.getByLabel('Master Grader', { exact: true }).selectOption('demo-grader-02')
        await page.getByRole('button', { name: 'Terapkan filter', exact: true }).click()
        await expect(page.getByText('2 batang', { exact: true })).toBeVisible()
        const rows = await exportRows(page)
        expect(rows).toHaveLength(await page.getByText(/^\d+ batang$/).count())
        expect(rows[0]).toContain('"demo-timber-01"')
        expect(rows[0]).toContain(',2,')
        await page.reload()
        await expect(page.getByText('2 batang', { exact: true })).toBeVisible()
        await captureEvidence(page, info, 'reporting')
    })
    await test.step('admin reads buyer history and purchase prices', async () => {
        await page.goto('/app/reports/buyer-history?graderId=demo-grader-02')
        await expect(page.locator('tbody tr')).toHaveCount(1)
        await expect(page.locator('tbody tr')).toContainText('UAT-REPORT-02')
        await page.goto('/app/reports/purchase-prices?period=2026-09')
        await expect(page.locator('tbody tr')).toHaveCount(2)
    })
    await test.step('maker sees processing work', async () => {
        await switchActor(page, actors.maker, '/app')
        await expect(page.locator('[data-testid$="-processing"]').first()).toBeVisible()
        await page.goto(production)
        await expect(page.getByText('4 batang', { exact: true })).toBeVisible()
    })
    await test.step('supervisor sees review work', async () => {
        await switchActor(page, actors.supervisor, '/app')
        await expect(page.locator('[data-testid$="-review"]').first()).toBeVisible()
    })
    await test.step('owners see only their own activity and no reports', async () => {
        await switchActor(page, actors.user, '/app')
        await expectActivity(page, 'UAT-REPORT-01', 'UAT-REPORT-02')
        await expectForbidden(page, [production, '/app/reports/purchase-prices'])
        await switchActor(page, actors.multiple, '/app')
        await expectActivity(page, 'UAT-REPORT-02', 'UAT-REPORT-01')
    })
    await test.step('grader sees assigned production without finance', async () => {
        await switchActor(page, actors.graderOne, '/app?period=2026-09')
        await expect(
            page.getByRole('heading', { name: 'Penugasan saya', exact: true }),
        ).toBeVisible()
        await expect(page.getByTestId('metric-buyer-outstanding')).toHaveCount(0)
        await page.goto(production)
        await expect(page.getByText('2 batang', { exact: true })).toBeVisible()
        await expect(page.getByText(/Rp\s?\d/)).toHaveCount(0)
        await expectForbidden(page, ['/app/reports/purchase-prices', '/app/reports/buyer-history'])
    })
    expect(errors).toEqual([])
})
