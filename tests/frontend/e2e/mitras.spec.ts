import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Persistent Mitra mock workflow')
const path = '/app/master-data/mitras'

test('creates, searches, edits and reloads Mitras with accessible draft validation', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path)
    await expect(page.getByRole('heading', { name: 'Master Mitra', exact: true })).toBeVisible()
    await expect(page.getByText('24 Mitra', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('button', { name: 'Tambah Mitra', exact: true }).click()
    await expect(page.getByLabel('Nama Mitra', { exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await expect(page.getByText('Field ini wajib diisi.')).toHaveCount(1)
    await page.getByLabel('Nama Mitra', { exact: true }).fill('Mitra Uji Mitra')
    await page.getByLabel('Nomor telepon', { exact: true }).fill('001234')
    await page.getByLabel('Alamat', { exact: true }).fill('Alamat pengujian')
    await page.getByRole('button', { name: 'Batal', exact: true }).click()
    const discard = page.getByRole('dialog', { name: 'Buang perubahan?' })
    await expect(discard).toBeVisible()
    await discard.getByRole('button', { name: 'Batal', exact: true }).click()
    await expect(page.getByLabel('Nama Mitra', { exact: true })).toHaveValue('Mitra Uji Mitra')
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await expect(page.getByText('Mitra berhasil disimpan.')).toBeVisible()
    await page.getByLabel('Cari Mitra', { exact: true }).fill('Mitra Uji Mitra')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByText('1 Mitra', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit Mitra: Mitra Uji Mitra', exact: true }).click()
    await page.getByLabel('Nama Mitra', { exact: true }).fill('Mitra Uji Revisi')
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await page.getByLabel('Cari Mitra', { exact: true }).fill('Mitra Uji Revisi')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await page.reload()
    await expect(page.getByRole('cell', { name: '001234', exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('mitras.png'), fullPage: true })
})

test('denies the master route and menu for non-admin permissions', async ({ page }) => {
    await login(page, 'user@woodflow.test', path)
    await page.goto(path)
    await expect(page).toHaveURL(/forbidden/)
    await expect(page.getByRole('link', { name: 'Master Mitra', exact: true })).toHaveCount(0)
})

test('keeps the draft on validation and csrf failures without automatic replay', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('validation')
    await page.getByRole('button', { name: 'Tambah Mitra', exact: true }).click()
    await page.getByLabel('Nama Mitra', { exact: true }).fill('Draft Tetap Ada')
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await expect(page.getByText('Periksa kembali nilai field ini.')).toBeVisible()
    await expect(page.getByLabel('Nama Mitra', { exact: true })).toHaveValue('Draft Tetap Ada')
    await page.keyboard.press('Escape')
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Konfirmasi', exact: true })
        .click()
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page.getByRole('button', { name: 'Tambah Mitra', exact: true }).click()
    await page.getByLabel('Nama Mitra', { exact: true }).fill('Draft CSRF')
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Nama Mitra', { exact: true })).toHaveValue('Draft CSRF')
    await page.getByRole('button', { name: 'Simpan Mitra', exact: true }).click()
    await expect(page.getByText('Mitra berhasil disimpan.')).toBeVisible()
    await expect(page.getByText('25 Mitra', { exact: true })).toBeVisible()
})
