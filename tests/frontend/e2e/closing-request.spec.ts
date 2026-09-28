import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import type * as RequestModule from '../closing-request-scenario'
import type * as ScenarioModule from '../closing-scenario'
import { login, expectNoOverflow } from './session-helpers'
async function scenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test.skip(process.env.E2E_PRODUCTION === 'true', 'Closing mock')
test('requests closing atomically with stale snapshot, race, rollback and replay protection', async ({
    page,
}) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { exerciseClosingRequest } = (await import(
            origin + '/tests/frontend/closing-request-scenario.ts'
        )) as typeof RequestModule
        return exerciseClosingRequest()
    })
    expect(result.failures).toEqual(['forbidden', 'forbidden', 'conflict', 'rollback', 'conflict'])
    expect(result.afterRollback).toBe(0)
    expect(result.successCount).toBe(1)
    expect(result.conflicts).toEqual(['conflict'])
    expect(result.records.meta.total).toBe(1)
    expect(result.records.data[0]?.id).toBe(result.replay.id)
    expect(result.snapshot).toEqual({ status: 'approved', auditCount: 1 })
    expect(result.current.reasons).toEqual(['active_request'])
    expect(result.current.allowedActions).toEqual([])
})
test('preserves notes through CSRF recovery and reconciles an uncertain closing request', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const poId = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createClosingScenario } = (await import(
            origin + '/tests/frontend/closing-scenario.ts'
        )) as typeof ScenarioModule
        return (await createClosingScenario()).context.po.id
    })
    await login(page, 'admin@woodflow.test', `/app/closings/new?purchaseOrderId=${poId}`)
    await page.getByLabel('Catatan pengajuan', { exact: true }).fill('Semua dokumen lengkap')
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Ajukan closing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByLabel('Catatan pengajuan', { exact: true })).toHaveValue(
        'Semua dokumen lengkap',
    )
    await expect(page.getByRole('alert')).toContainText('Sesi diperbarui')
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Ajukan closing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Catatan pengajuan', { exact: true })).toBeDisabled()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail closing', exact: true })).toBeVisible()
    await expect(page.getByText('Semua dokumen lengkap', { exact: true })).toBeVisible()
    await expect(page.getByText('Menunggu persetujuan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Semua dokumen lengkap', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        path: `../docs/evidence/sprint-11a/request-${info.project.name}.png`,
        fullPage: true,
    })
    await page.getByRole('link', { name: 'Riwayat closing', exact: true }).click()
    await expect(page.getByText('1 pengajuan closing', { exact: true })).toBeVisible()
})
