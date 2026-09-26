import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Persistent bank account owners')
const path = '/app/master-data/bank-accounts'
test('selects paginated owners, clears incompatible selections and locks saved ownership', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByRole('button', { name: 'Tambah Rekening', exact: true }).click()
    await page.getByLabel('Nama bank', { exact: true }).fill('Bank Pemilik Uji')
    await page.getByLabel('Nomor rekening', { exact: true }).fill('000-OWNER-DEMO')
    await page.getByLabel('Atas nama', { exact: true }).fill('Pemilik Uji')
    await page.getByLabel('Jenis pemilik', { exact: true }).selectOption('buyer')
    await page.getByRole('button', { name: 'Pemilik berikutnya', exact: true }).click()
    await page.getByLabel('Pemilik rekening', { exact: true }).selectOption('demo-buyer-24')
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toHaveValue('demo-buyer-24')
    await page.getByLabel('Jenis pemilik', { exact: true }).selectOption('mitra')
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toHaveValue('')
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(page.getByText('Field ini wajib diisi.', { exact: true })).toBeVisible()
    await page.getByLabel('Cari pemilik', { exact: true }).fill('Simulasi 02')
    await page.getByLabel('Cari pemilik', { exact: true }).press('Enter')
    await page.getByLabel('Pemilik rekening', { exact: true }).selectOption('demo-mitra-02')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('bank-account-owner-form.png'), fullPage: true })
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(page.getByText('Rekening berhasil disimpan.')).toBeVisible()
    await page.getByRole('button', { name: 'Edit Rekening: Bank Pemilik Uji', exact: true }).click()
    await expect(page.getByLabel('Jenis pemilik', { exact: true })).toBeDisabled()
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toBeDisabled()
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toHaveValue('demo-mitra-02')
    await page.getByLabel('Nomor rekening', { exact: true }).fill('000-OWNER-EDIT')
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await page.reload()
    await expect(page.getByRole('cell', { name: '000-OWNER-EDIT', exact: true })).toBeVisible()
})

test('keeps selected ownership across lookup pages and ignores abandoned requests', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('read')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByRole('button', { name: 'Tambah Rekening', exact: true }).click()
    await page.getByLabel('Jenis pemilik', { exact: true }).selectOption('buyer')
    await page.getByLabel('Jenis pemilik', { exact: true }).selectOption('mitra')
    await page.getByLabel('Pemilik rekening', { exact: true }).selectOption('demo-mitra-01')
    await page.getByRole('button', { name: 'Pemilik berikutnya', exact: true }).click()
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toBeEnabled()
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toHaveValue('demo-mitra-01')
    await expect(page.locator('#bank-account-owner option:checked')).toHaveText('Mitra Simulasi 01')
    await expect(page.locator('#bank-account-owner option[value^="demo-buyer-"]')).toHaveCount(0)
    await page.getByLabel('Jenis pemilik', { exact: true }).selectOption('company')
    await expect(page.getByLabel('Pemilik rekening', { exact: true })).toHaveCount(0)
})
