import { expect, test } from '@playwright/test'
import { fillTimber } from './timber-helpers'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Persistent timber mock workflow')
const path = '/app/master-data/timber-products'
test('creates and edits timber with decimal preview, validation, discard and persistent search', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path)
    await expect(page.getByText('24 Kayu', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('button', { name: 'Tambah Kayu', exact: true }).click()
    await expect(page.getByLabel('Nama Kayu', { exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(page.getByText('Field ini wajib diisi.')).toHaveCount(6)
    await fillTimber(page, 'Kayu Pengujian')
    await expect(page.getByRole('dialog').getByText('0.062832', { exact: true })).toBeVisible()
    await expect(page.getByText('Volume simulasi, bukan SNI', { exact: true })).toBeVisible()
    await page.screenshot({ path: info.outputPath('timber-form.png'), fullPage: true })
    await page.getByRole('button', { name: 'Batal', exact: true }).click()
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Batal', exact: true })
        .click()
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(page.getByText('Kayu berhasil disimpan.')).toBeVisible()
    await page.getByLabel('Cari Kayu', { exact: true }).fill('Kayu Pengujian')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByText('1 Kayu', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit Kayu: Kayu Pengujian', exact: true }).click()
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('30')
    await expect(page.getByRole('dialog').getByText('0.141372', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await page.reload()
    await expect(page.getByRole('cell', { name: '0.141372', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '100000.50', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '150000.00', exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('timber-list.png'), fullPage: true })
})
test('denies the master route and menu to a grader', async ({ page }) => {
    await login(page, 'grader1@woodflow.test', path)
    await page.goto(path)
    await expect(page).toHaveURL(/forbidden/)
    await expect(page.getByRole('link', { name: 'Master Kayu', exact: true })).toHaveCount(0)
})
