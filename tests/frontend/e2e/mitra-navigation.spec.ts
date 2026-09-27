import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Mitra mock navigation')
test('confirms dirty browser navigation and keeps a small-screen form keyboard accessible', async ({
    page,
}, info) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await login(page)
    await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click()
    await page.getByRole('link', { name: 'Master Mitra', exact: true }).click()
    await page.getByRole('button', { name: 'Tambah Mitra', exact: true }).click()
    await page.getByLabel('Nama Mitra', { exact: true }).fill('Draft Navigasi')
    await page.evaluate(() => history.back())
    const confirm = page.getByRole('dialog', { name: 'Buang perubahan?' })
    await expect(confirm).toBeVisible()
    await expect(confirm.getByRole('button', { name: 'Batal', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(confirm).not.toBeVisible()
    await expect(page.getByLabel('Nama Mitra', { exact: true })).toHaveValue('Draft Navigasi')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('mitra-form.png'), fullPage: true })
    await page.setViewportSize({ width: 812, height: 375 })
    await expectNoOverflow(page)
    await page.evaluate(() => history.back())
    await confirm.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/$/)
    await expect(page.getByRole('dialog', { name: 'Tambah Mitra', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})
