import { test, expect } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Development mock only')

test('persists changes, scopes records across roles, and resets with keyboard confirmation', async ({
    page,
}, info) => {
    await login(page)
    const panel = page.getByTestId('persistent-demo')
    await panel.locator('summary').click()
    const first = page.getByTestId('demo-sample-one')
    await first.getByRole('button', { name: 'Tambah nilai sampel' }).click()
    await expect(first).toContainText('Nilai tersimpan: 1')
    await page.reload()
    await panel.locator('summary').click()
    await expect(first).toContainText('Nilai tersimpan: 1')
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test')
    await panel.locator('summary').click()
    await expect(first).toContainText('Nilai tersimpan: 1')
    await expect(page.getByTestId('demo-sample-two')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reset data simulasi' })).toHaveCount(0)
    await first.getByRole('button', { name: 'Tambah nilai sampel' }).click()
    await expect(first).toContainText('Nilai tersimpan: 2')
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page)
    await panel.locator('summary').click()
    await page.evaluate(() => localStorage.setItem('unrelated-demo-test', 'preserved'))
    await page.getByRole('button', { name: 'Reset data simulasi' }).click()
    await expect(page.getByRole('button', { name: 'Batal', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(first).toContainText('Nilai tersimpan: 2')
    await page.getByRole('button', { name: 'Reset data simulasi' }).click()
    await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(first).toContainText('Nilai tersimpan: 0')
    expect(await page.evaluate(() => localStorage.getItem('unrelated-demo-test'))).toBe('preserved')
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('persistent-demo.png'), fullPage: true })
})

test('keeps failed writes unchanged and reconciles an ambiguous response without duplication', async ({
    page,
}) => {
    await login(page)
    await page.getByTestId('persistent-demo').locator('summary').click()
    const first = page.getByTestId('demo-sample-one')
    await page.getByLabel('Skenario operasi', { exact: true }).selectOption('quota')
    await first.getByRole('button').click()
    await expect(page.getByRole('alert')).toContainText('Penyimpanan browser penuh')
    await expect(first).toContainText('Nilai tersimpan: 0')
    await page.getByLabel('Skenario operasi', { exact: true }).selectOption('committed-timeout')
    await first.getByRole('button').click()
    await expect(page.getByRole('alert')).toContainText('Respons gagal')
    await expect(first).toContainText('Nilai tersimpan: 1')
    await page.getByLabel('Skenario operasi', { exact: true }).selectOption('success')
    await page.getByRole('button', { name: 'Ulangi simpan dengan kunci yang sama' }).click()
    await expect(
        page.getByRole('button', { name: 'Ulangi simpan dengan kunci yang sama' }),
    ).toHaveCount(0)
    await expect(first).toContainText('Nilai tersimpan: 1')
})

test('refreshes another tab after writes and reset', async ({ page, context }) => {
    await login(page)
    await page.getByTestId('persistent-demo').locator('summary').click()
    const other = await context.newPage()
    await login(other, 'grader1@woodflow.test')
    await other.getByTestId('persistent-demo').locator('summary').click()
    await page.getByTestId('demo-sample-one').getByRole('button').click()
    await expect(other.getByTestId('demo-sample-one')).toContainText('Nilai tersimpan: 1')
    await page.getByRole('button', { name: 'Reset data simulasi' }).click()
    await page.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(other.getByTestId('demo-sample-one')).toContainText('Nilai tersimpan: 0')
    await other.close()
})

test('recovers from CSRF without replaying a write and expires on 401', async ({ page }) => {
    await login(page)
    await page.getByTestId('persistent-demo').locator('summary').click()
    await page.getByLabel('Skenario operasi', { exact: true }).selectOption('csrf')
    await page.getByTestId('demo-sample-one').getByRole('button').click()
    await expect(page.getByRole('alert')).toContainText('Sesi diperbarui')
    await expect(page.getByTestId('demo-sample-one')).toContainText('Nilai tersimpan: 0')
    await page.getByLabel('Skenario operasi', { exact: true }).selectOption('unauthenticated')
    await page.getByTestId('demo-sample-one').getByRole('button').click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
})
