import { test, expect } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Development UI lab only')

test('validates fields and controls table state, sorting, and pagination', async ({
    page,
}, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await login(page, 'admin@woodflow.test', '/app/development/ui')
    await page.getByRole('button', { name: 'Simpan simulasi' }).click()
    await expect(page.getByLabel('Nama sampel', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await page.getByLabel('Nama sampel', { exact: true }).fill('Contoh sintetis')
    await page.getByRole('button', { name: 'Simpan simulasi' }).click()
    await expect(page.getByRole('button', { name: 'Simpan simulasi' })).toBeDisabled()
    await expect(page.getByText('Simulasi berhasil disimpan.')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Sampel 001', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'Sampel 004', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Nama sampel' }).click()
    await expect(page.getByRole('cell', { name: 'Sampel 007', exact: true })).toBeVisible()
    for (const state of ['loading', 'empty', 'error']) {
        await page.getByLabel('State tabel').selectOption(state)
        await expect(page.getByRole('table')).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await expect(page.getByRole('table')).toBeVisible()
    await expectNoOverflow(page)
    expect(errors).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('shared-ui.png'), fullPage: true })
})

test('traps modal focus, returns it, and cleans up scroll on navigation', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', '/app/development/ui')
    const trigger = page.getByRole('button', { name: 'Buka modal', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi simulasi' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Batal', exact: true })).toBeFocused()
    for (let index = 0; index < 7; index += 1) {
        await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab')
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
            true,
        )
    }
    await page.screenshot({ path: info.outputPath('confirmation.png'), fullPage: false })
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
    await trigger.click()
    await dialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Simulasi dikonfirmasi.')).toBeVisible()
    await page.getByRole('button', { name: 'Pratinjau', exact: true }).first().click()
    await expect(page.getByRole('dialog', { name: 'Pratinjau sampel' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})
