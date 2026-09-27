import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO review workflow')
const path = '/app/purchase-orders'
async function switchActor(page: Page, email: string): Promise<void> {
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).not.toBeVisible()
}
async function simulation(page: Page, scenario: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(scenario)
}

test('rejects from the review queue, lets the owner revise and resubmit, then approves', async ({
    page,
}, info) => {
    await login(page, 'supervisor@woodflow.test', path)
    await page.getByRole('link', { name: 'Menunggu review', exact: true }).click()
    await expect(page).toHaveURL(/status=submitted/)
    await expect(page.getByText('5 PO', { exact: true })).toBeVisible()
    await page.getByRole('row').filter({ hasText: 'DEMO-PO-02' }).getByRole('link').click()
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Tolak PO' })
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toBeFocused()
    await dialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Isi alasan penolakan dengan 1 sampai 2.000 karakter.'),
    ).toBeVisible()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Perbaiki jumlah pesanan')
    await page.keyboard.press('Escape')
    const discard = page.getByRole('dialog').filter({ hasText: 'Buang perubahan?' })
    await expect(discard).toBeVisible()
    await discard.getByRole('button', { name: 'Batal', exact: true }).click()
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveValue(
        'Perbaiki jumlah pesanan',
    )
    await dialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Perbaiki jumlah pesanan', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({
        path: info.outputPath('purchase-order-review-rejected.png'),
        fullPage: true,
    })
    await switchActor(page, 'user@woodflow.test')
    await page.goto(path + '/demo-po-02')
    await expect(page.getByText('Perbaiki jumlah pesanan', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toHaveCount(0)
    await page.getByRole('link', { name: 'Edit PO', exact: true }).click()
    await page.getByLabel('Jumlah baris 1', { exact: true }).fill('3')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Perbaiki jumlah pesanan', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Submit PO', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(page.getByText('Perbaiki jumlah pesanan', { exact: true })).toHaveCount(0)
    await switchActor(page, 'admin@woodflow.test')
    await page.goto(path + '/demo-po-02?status=submitted')
    const approve = page.getByRole('button', { name: 'Setujui PO', exact: true })
    await approve.focus()
    await page.keyboard.press('Enter')
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(approve).toBeFocused()
    await approve.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expect(approve).toHaveCount(0)
    await expectNoOverflow(page)
    await page.screenshot({
        path: info.outputPath('purchase-order-review-approved.png'),
        fullPage: true,
    })
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page).toHaveURL(/status=submitted/)
    await expect(page.getByRole('cell', { name: 'DEMO-PO-02', exact: true })).toHaveCount(0)
})

test('recovers rejection draft after CSRF and resolves a committed timeout by rereading', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path + '/demo-po-02')
    await simulation(page, 'csrf')
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Periksa ukuran')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa keputusan lalu konfirmasi kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveValue('Periksa ukuran')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await page.goto(path + '/demo-po-07')
    await simulation(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Alasan sudah tersimpan')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toBeDisabled()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await expect(page.getByText('Alasan sudah tersimpan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Purchase Order', exact: true })).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('keeps failed review status unchanged and requires reread after conflict', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path + '/demo-po-02')
    await simulation(page, 'conflict')
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Periksa jumlah')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }),
    ).toBeDisabled()
    await page.getByRole('dialog').getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'DEMO-PO-02', exact: true })).toBeVisible()
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toHaveCount(0)
    await simulation(page, 'success')
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveValue('Periksa jumlah')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
})
