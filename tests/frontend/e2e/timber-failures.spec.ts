import { fillTimber } from './timber-helpers'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Kayu mock failure controls')
const path = '/app/master-data/timber-products'
async function control(page: Page, scenario: string, operation = 'update'): Promise<void> {
    const panel = page
        .locator('details')
        .filter({ has: page.getByText('Simulasi persisten', { exact: true }) })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption(operation)
    await page.getByLabel('Skenario operasi').selectOption(scenario)
}
async function fillKayu(page: Page, company: string): Promise<void> {
    await page.getByRole('button', { name: 'Tambah Kayu', exact: true }).click()
    await fillTimber(page, company)
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
        await fillKayu(page, 'Draft Ditolak')
        await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
        await expect(
            page.getByRole('dialog', { name: 'Tambah Kayu', exact: true }).getByRole('alert'),
        ).toBeVisible()
        await expect(page.getByLabel('Nama Kayu', { exact: true })).toHaveValue('Draft Ditolak')
        await discard(page)
        await expect(page.getByText('24 Kayu', { exact: true })).toBeVisible()
    }
    await control(page, 'committed-timeout')
    await fillKayu(page, 'Tersimpan Sekali')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(
        page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Nama Kayu', { exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }).click()
    await expect(
        page.getByRole('button', { name: 'Ulangi penyimpanan', exact: true }),
    ).toBeEnabled()
    await discard(page)
    await control(page, 'success')
    await expect(page.getByText('25 Kayu', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('cell', { name: 'Tersimpan Sekali', exact: true })).toHaveCount(1)
})

test('handles empty, failed reads, latest search and session expiration', async ({ page }) => {
    await login(page, 'admin@woodflow.test', path)
    await control(page, 'empty', 'read')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('0 Kayu', { exact: true })).toBeVisible()
    await control(page, 'network', 'read')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Koneksi terputus. Silakan coba lagi.')).toBeVisible()
    await control(page, 'success', 'read')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByLabel('Cari Kayu', { exact: true }).fill('Simulasi 01')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await page.getByLabel('Cari Kayu', { exact: true }).fill('Simulasi 02')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'Kayu Simulasi 02', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Kayu Simulasi 01', exact: true })).toHaveCount(0)
    await control(page, 'unauthenticated')
    await fillKayu(page, 'Tidak Tersimpan')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
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
    const edit = 'Edit Kayu: Kayu Simulasi 24'
    await page.getByRole('button', { name: edit, exact: true }).click()
    await other.getByRole('button', { name: edit, exact: true }).click()
    await other.getByLabel('Nama Kayu', { exact: true }).fill('Perubahan Tab Kedua')
    await other.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(other.getByText('Kayu berhasil disimpan.')).toBeVisible()
    await page.getByLabel('Nama Kayu', { exact: true }).fill('Draft Tab Pertama')
    await page.getByRole('button', { name: 'Simpan Kayu', exact: true }).click()
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Nama Kayu', { exact: true })).toHaveValue('Draft Tab Pertama')
    await discard(page)
    await expect(page.getByRole('cell', { name: 'Perubahan Tab Kedua', exact: true })).toBeVisible()
    await other.close()
})
