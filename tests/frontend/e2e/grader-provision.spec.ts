import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Grader provisioning simulation')
const path = '/app/master-data/graders'

test('rejects duplicate email and locks only the login email after a confirmed provision', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByRole('button', { name: 'Tambah Grader', exact: true }).click()
    await page.getByLabel('Nama Grader', { exact: true }).fill('Grader Aktivasi')
    await page.getByLabel('Email login', { exact: true }).fill('GRADER1@WOODFLOW.TEST')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Email sudah digunakan.', { exact: true })).toBeVisible()
    await page.getByLabel('Email login', { exact: true }).fill('activation@woodflow.test')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Grader berhasil disimpan.')).toBeVisible()
    await page.getByRole('button', { name: 'Edit Grader: Grader Aktivasi', exact: true }).click()
    await expect(page.getByLabel('Email login', { exact: true })).toBeEnabled()
    await page.getByLabel('Email login', { exact: true }).fill('changed@woodflow.test')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await page
        .getByRole('button', { name: 'Ajukan aktivasi: Grader Aktivasi', exact: true })
        .click()
    const dialog = page.getByRole('dialog', { name: 'Ajukan aktivasi Grader?' })
    await expect(dialog.getByRole('button', { name: 'Batal', exact: true })).toBeFocused()
    await expect(dialog.getByText('changed@woodflow.test')).toBeVisible()
    await expect(dialog.getByText(/tidak membuat akun login/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Ajukan aktivasi', exact: true }).click()
    await expect(page.getByText('Pengajuan aktivasi berhasil disimpan.')).toBeVisible()
    await expect(
        page.getByRole('button', { name: 'Ajukan aktivasi: Grader Aktivasi', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Edit Grader: Grader Aktivasi', exact: true }).click()
    await expect(page.getByLabel('Email login', { exact: true })).toBeDisabled()
    await page.getByLabel('Nomor telepon', { exact: true }).fill('000777')
    await page.getByRole('button', { name: 'Simpan Grader', exact: true }).click()
    await expect(page.getByText('Grader berhasil disimpan.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: 'Grader Aktivasi' })).toContainText(
        'Menunggu aktivasi',
    )
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('graders.png'), fullPage: true })
})

test('recovers provisioning after csrf without replay and reconciles an uncertain result', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page
        .getByRole('button', { name: 'Ajukan aktivasi: Grader Simulasi 24', exact: true })
        .click()
    const dialog = page.getByRole('dialog', { name: 'Ajukan aktivasi Grader?' })
    await dialog.getByRole('button', { name: 'Ajukan aktivasi', exact: true }).click()
    await expect(
        dialog.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'Grader Simulasi 24' })).toContainText(
        'Belum diajukan',
    )
    await dialog.getByRole('button', { name: 'Ajukan aktivasi', exact: true }).click()
    await expect(page.getByText('Pengajuan aktivasi berhasil disimpan.')).toBeVisible()
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('committed-timeout')
    await page
        .getByRole('button', { name: 'Ajukan aktivasi: Grader Simulasi 23', exact: true })
        .click()
    await dialog.getByRole('button', { name: 'Ajukan aktivasi', exact: true }).click()
    await expect(
        dialog.getByRole('button', { name: 'Ulangi pengajuan', exact: true }),
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Ulangi pengajuan', exact: true }).click()
    await expect(
        dialog.getByRole('button', { name: 'Ulangi pengajuan', exact: true }),
    ).toBeEnabled()
    await dialog.getByRole('button', { name: 'Batal', exact: true }).click()
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Konfirmasi', exact: true })
        .click()
    await page.getByLabel('Skenario operasi').selectOption('success')
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: 'Grader Simulasi 23' })).toContainText(
        'Menunggu aktivasi',
    )
})
