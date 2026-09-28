import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type * as ScenarioModule from '../grading-scenario'
import { login } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Invoice recovery mock')
async function scenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test('preserves dirty terms after 419 and retries committed timeout without duplicate invoice', async ({
    page,
}) => {
    await page.goto('/app')
    await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createApprovedGradingScenario } = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof ScenarioModule
        await createApprovedGradingScenario('woodflow-demo')
    })
    await login(page, 'admin@woodflow.test', '/app/invoices/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByLabel('Nama termin', { exact: true }).fill('DP RETRY')
    await page.getByLabel('Nominal termin', { exact: true }).fill('1700000.00')
    await page.getByRole('link', { name: 'Batal', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Buang perubahan?' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Sesi diperbarui. Periksa draft sebelum mencoba kembali.', { exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Nama termin', { exact: true })).toHaveValue('DP RETRY')
    await expect(page.getByLabel('Nominal termin', { exact: true })).toHaveValue('1700000.00')
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Nama termin', { exact: true })).toBeDisabled()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail invoice', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByText('5 invoice', { exact: true })).toBeVisible()
})
