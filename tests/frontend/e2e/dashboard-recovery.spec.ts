import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Dashboard mock')
async function setScenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('read')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test('distinguishes loading and errors from zero and removes finance when the actor changes', async ({
    page,
}) => {
    await login(page)
    await expect(page.getByTestId('metric-buyer-outstanding')).toBeVisible()
    await setScenario(page, 'network')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).first().click()
    await expect(page.getByRole('alert').filter({ hasText: 'Koneksi' })).toBeVisible()
    await expect(page.getByTestId('metric-buyer-outstanding')).toHaveCount(0)
    await setScenario(page, 'success')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).first().click()
    await expect(page.getByText('Memuat ringkasan...', { exact: true })).toBeVisible()
    await expect(page.getByTestId('metric-buyer-outstanding')).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test')
    await expect(page.getByRole('heading', { name: 'Penugasan saya', exact: true })).toBeVisible()
    await expect(page.getByTestId('metric-buyer-outstanding')).toHaveCount(0)
    await expect(page.getByTestId('metric-mitra-outstanding')).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Penugasan saya', exact: true })).toBeVisible()
})
