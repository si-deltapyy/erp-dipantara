import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Persistent Grader mock workflow')
const path = '/app/master-data/graders'

test('creates, searches, edits and reloads Graders with accessible draft validation', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path)
    await expect(page.getByRole('heading', { name: 'Master Grader', exact: true })).toBeVisible()
    await expect(page.getByText('24 Grader', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('button', { name: 'Tambah Grader', exact: true }).click()
    await expect(page.getByLabel('Nama Grader', { exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Field ini wajib diisi.')).toHaveCount(2)
    await page.getByLabel('Nama Grader', { exact: true }).fill('Grader Uji Grader')
    await page.getByLabel('Email login', { exact: true }).fill('profile@woodflow.test')
    await page.getByLabel('Nomor telepon', { exact: true }).fill('001234')
    await page.getByLabel('Alamat', { exact: true }).fill('Alamat pengujian')
    await page.getByRole('button', { name: 'Batal', exact: true }).click()
    const discard = page.getByRole('dialog', { name: 'Buang perubahan?' })
    await expect(discard).toBeVisible()
    await discard.getByRole('button', { name: 'Batal', exact: true }).click()
    await expect(page.getByLabel('Nama Grader', { exact: true })).toHaveValue('Grader Uji Grader')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Grader berhasil disimpan.')).toBeVisible()
    await page.getByLabel('Cari Grader', { exact: true }).fill('Grader Uji Grader')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByText('1 Grader', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit Grader: Grader Uji Grader', exact: true }).click()
    await page.getByLabel('Nama Grader', { exact: true }).fill('Grader Uji Revisi')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await page.getByLabel('Cari Grader', { exact: true }).fill('Grader Uji Revisi')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page).toHaveURL(/search=Grader\+Uji\+Revisi/)
    await expect(page.getByRole('cell', { name: 'Grader Uji Revisi', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('cell', { name: '001234', exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('graders.png'), fullPage: true })
})

test('denies the master route and menu for non-admin permissions', async ({ page }) => {
    await login(page, 'user@woodflow.test', path)
    await page.goto(path)
    await expect(page).toHaveURL(/forbidden/)
    await expect(page.getByRole('link', { name: 'Master Grader', exact: true })).toHaveCount(0)
})

test('keeps the draft on validation and csrf failures without automatic replay', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('validation')
    await page.getByRole('button', { name: 'Tambah Grader', exact: true }).click()
    await page.getByLabel('Nama Grader', { exact: true }).fill('Draft Tetap Ada')
    await page.getByLabel('Email login', { exact: true }).fill('validation@woodflow.test')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Periksa kembali nilai field ini.')).toBeVisible()
    await expect(page.getByLabel('Nama Grader', { exact: true })).toHaveValue('Draft Tetap Ada')
    await page.keyboard.press('Escape')
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Konfirmasi', exact: true })
        .click()
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page.getByRole('button', { name: 'Tambah Grader', exact: true }).click()
    await page.getByLabel('Nama Grader', { exact: true }).fill('Draft CSRF')
    await page.getByLabel('Email login', { exact: true }).fill('csrf@woodflow.test')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Nama Grader', { exact: true })).toHaveValue('Draft CSRF')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Grader berhasil disimpan.')).toBeVisible()
    await expect(page.getByText('25 Grader', { exact: true })).toBeVisible()
})
