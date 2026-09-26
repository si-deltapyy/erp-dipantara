import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO failure recovery')
async function control(
    page: Page,
    scenario: string,
    operation = 'update',
    latency = '0',
): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption(operation)
    await page.getByLabel('Skenario operasi').selectOption(scenario)
    await page.getByLabel('Jeda simulasi').selectOption(latency)
}
async function fill(page: Page, number: string): Promise<void> {
    await page.getByLabel('Buyer', { exact: true }).selectOption('demo-buyer-01')
    await page.getByLabel('Nomor PO', { exact: true }).fill(number)
    await page.getByLabel('Tanggal PO', { exact: true }).fill('2026-09-26')
    await page.getByLabel('Kayu baris 1', { exact: true }).selectOption('demo-timber-01')
    await page.getByLabel('Harga satuan baris 1', { exact: true }).fill('100.00')
}
test('retains form on 422 and 419 and explicitly retries committed timeouts exactly once', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders/new')
    await fill(page, 'DEMO-RECOVERY')
    await control(page, 'validation')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByLabel('Jumlah baris 1', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await control(page, 'csrf')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Nomor PO', { exact: true })).toHaveValue('DEMO-RECOVERY')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('purchase-order-form.png'), fullPage: true })
    await control(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Nomor PO', { exact: true })).toBeDisabled()
    await control(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail PO', exact: true })).toBeVisible()
    await control(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Submit PO', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await control(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('DEMO-RECOVERY')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await expect(page.getByText('1 PO', { exact: true })).toBeVisible()
})
test('preserves conflict drafts and handles read failures as errors rather than empty data', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders/demo-po-01/edit')
    await page.getByLabel('Catatan', { exact: true }).fill('Draft konflik')
    await control(page, 'conflict')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Catatan', { exact: true })).toHaveValue('Draft konflik')
    await page.getByRole('link', { name: 'Batal', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await control(page, 'network', 'read')
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByText('Koneksi terputus. Silakan coba lagi.').first()).toBeVisible()
    await expect(page.getByText('Belum ada PO yang sesuai.', { exact: true })).toHaveCount(0)
    await control(page, 'empty', 'read')
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Belum ada PO yang sesuai.', { exact: true })).toBeVisible()
})

test('ignores stale searches, prevents double writes and clears expired actor drafts', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders')
    await control(page, 'success', 'read', '1500')
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('DEMO-PO-01')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await control(page, 'success', 'read')
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('DEMO-PO-02')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await expect(page.getByRole('cell', { name: 'DEMO-PO-02', exact: true })).toBeVisible()
    await page.waitForTimeout(1700)
    await expect(page.getByRole('cell', { name: 'DEMO-PO-01', exact: true })).toHaveCount(0)
    await page.getByRole('link', { name: 'Tambah PO', exact: true }).click()
    await fill(page, 'DEMO-DOUBLE')
    await control(page, 'success', 'update', '1500')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simpan draft', exact: true })).toBeDisabled()
    await expect(page.getByRole('heading', { name: 'Detail PO', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Edit PO', exact: true }).click()
    await page.getByLabel('Catatan', { exact: true }).fill('Private draft')
    await control(page, 'unauthenticated')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    await page.getByLabel('Email', { exact: true }).fill('multiple@woodflow.test')
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByText('PO tidak ditemukan atau tidak dapat diakses.')).toBeVisible()
    await expect(page.getByText('Private draft', { exact: true })).toHaveCount(0)
})
