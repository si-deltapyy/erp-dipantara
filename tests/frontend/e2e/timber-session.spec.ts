import { expect, test } from '@playwright/test'
import { login } from './session-helpers'
import { fillTimber } from './timber-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Timber mock session recovery')
const path = '/app/master-data/timber-products'
test('keeps the draft on validation and csrf failures without automatic replay', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('validation')
    await page.getByRole('button', { name: 'Tambah Kayu', exact: true }).click()
    await fillTimber(page, 'Draft Tetap Ada')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(page.getByText('Periksa kembali nilai field ini.')).toBeVisible()
    await expect(page.getByLabel('Nama Kayu', { exact: true })).toHaveValue('Draft Tetap Ada')
    await page.keyboard.press('Escape')
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Konfirmasi', exact: true })
        .click()
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page.getByRole('button', { name: 'Tambah Kayu', exact: true }).click()
    await fillTimber(page, 'Draft CSRF')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Nama Kayu', { exact: true })).toHaveValue('Draft CSRF')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(page.getByText('Kayu berhasil disimpan.')).toBeVisible()
    await expect(page.getByText('25 Kayu', { exact: true })).toBeVisible()
})
