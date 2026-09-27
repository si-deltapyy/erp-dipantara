import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
import { prepareGradingAssignment } from './grading-helpers'
test.use({ actionTimeout: 15000 })
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading recovery mock')
async function scenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test('recovers measured drafts after CSRF and safely retries committed save and submit', async ({
    page,
}) => {
    await prepareGradingAssignment(page)
    const formUrl = page.url()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'admin@woodflow.test', formUrl)
    await page.getByLabel('Jumlah batang', { exact: true }).fill('2')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('25')
    await page.getByLabel('Panjang (m)', { exact: true }).fill('2')
    const rowId = await page.getByLabel('Diameter (cm)', { exact: true }).getAttribute('id')
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Diameter (cm)', { exact: true })).toHaveValue('25')
    await expect(page.getByLabel('Diameter (cm)', { exact: true })).toHaveAttribute('id', rowId!)
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Diameter (cm)', { exact: true })).toBeDisabled()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail grading', exact: true })).toBeVisible()
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Submit grading', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByText('1 grading', { exact: true })).toBeVisible()
})
