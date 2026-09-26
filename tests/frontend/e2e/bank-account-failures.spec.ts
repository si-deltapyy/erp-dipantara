import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Rekening mock failure controls')
const path = '/app/master-data/bank-accounts'
async function control(page: Page, scenario: string, operation = 'update'): Promise<void> {
    const panel = page
        .locator('details')
        .filter({ has: page.getByText('Simulasi persisten', { exact: true }) })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption(operation)
    await page.getByLabel('Skenario operasi').selectOption(scenario)
}
async function fillRekening(page: Page, company: string): Promise<void> {
    await page.getByRole('button', { name: 'Tambah Rekening', exact: true }).click()
    await page.getByLabel('Nama bank', { exact: true }).fill(company)
    await page.getByLabel('Nomor rekening', { exact: true }).fill('000-DEMO')
    await page.getByLabel('Atas nama', { exact: true }).fill('Pemilik sintetis')
}
async function discard(page: Page): Promise<void> {
    await page.keyboard.press('Escape')
    await page
        .getByRole('dialog', { name: 'Buang perubahan?' })
        .getByRole('button', { name: 'Konfirmasi', exact: true })
        .click()
}

test('retains drafts for rejected writes and reconciles ambiguous success with one record', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    for (const failure of ['forbidden', 'not-found', 'conflict']) {
        await control(page, failure)
        await fillRekening(page, 'Draft Ditolak')
        await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
        await expect(
            page.getByRole('dialog', { name: 'Tambah Rekening', exact: true }).getByRole('alert'),
        ).toBeVisible()
        await expect(page.getByLabel('Nama bank', { exact: true })).toHaveValue('Draft Ditolak')
        await discard(page)
        await expect(page.getByText('24 Rekening', { exact: true })).toBeVisible()
    }
    await control(page, 'committed-timeout')
    await fillRekening(page, 'Tersimpan Sekali')
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(
        page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Nama bank', { exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }).click()
    await expect(
        page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }),
    ).toBeEnabled()
    await discard(page)
    await control(page, 'success')
    await expect(page.getByText('25 Rekening', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('cell', { name: 'Tersimpan Sekali', exact: true })).toHaveCount(1)
})

test('handles empty, failed reads, latest search and session expiration', async ({ page }) => {
    await login(page, 'admin@woodflow.test', path)
    await control(page, 'empty', 'read')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('0 Rekening', { exact: true })).toBeVisible()
    await control(page, 'network', 'read')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Koneksi terputus. Silakan coba lagi.')).toBeVisible()
    await control(page, 'success', 'read')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByLabel('Cari Rekening', { exact: true }).fill('Simulasi 01')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await page.getByLabel('Cari Rekening', { exact: true }).fill('Simulasi 02')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'Bank Simulasi 02', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Bank Simulasi 01', exact: true })).toHaveCount(0)
    await control(page, 'unauthenticated')
    await fillRekening(page, 'Tidak Tersimpan')
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Masuk ke ruang kerja', exact: true }),
    ).toBeVisible()
})

test('refreshes across tabs and protects an open draft from conflicting updates', async ({
    page,
    context,
}) => {
    await login(page, 'admin@woodflow.test', path)
    const other = await context.newPage()
    await login(other, 'admin@woodflow.test', path)
    const edit = 'Edit Rekening: Bank Simulasi 24'
    await page.getByRole('button', { name: edit, exact: true }).click()
    await other.getByRole('button', { name: edit, exact: true }).click()
    await other.getByLabel('Nama bank', { exact: true }).fill('Perubahan Tab Kedua')
    await other.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(other.getByText('Rekening berhasil disimpan.')).toBeVisible()
    await page.getByLabel('Nama bank', { exact: true }).fill('Draft Tab Pertama')
    await page.getByRole('button', { name: 'Simpan Rekening', exact: true }).click()
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Nama bank', { exact: true })).toHaveValue('Draft Tab Pertama')
    await discard(page)
    await expect(page.getByRole('cell', { name: 'Perubahan Tab Kedua', exact: true })).toBeVisible()
    await other.close()
})
