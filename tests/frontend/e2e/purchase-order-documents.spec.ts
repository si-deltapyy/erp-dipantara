import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Document mock workflow')
const path = '/app/purchase-orders/demo-po-03'
const png = {
    name: 'synthetic-po.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
        'base64',
    ),
}
async function simulation(page: Page, scenario: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(scenario)
}
test('uploads, previews and downloads persisted documents without changing PO approval', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', path)
    await expect(page.getByText('Belum ada dokumen PO.')).toBeVisible()
    await page.getByLabel('Pilih dokumen PO').setInputFiles(png)
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText(png.name, { exact: true })).toBeVisible()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    const preview = page.getByRole('button', { name: 'Pratinjau dokumen' })
    await preview.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img', { name: png.name })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(preview).toBeFocused()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Unduh dokumen' }).click()
    expect((await download).suggestedFilename()).toBe(png.name)
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('purchase-order-documents.png'), fullPage: true })
})
test('validates files, confirms dirty navigation and rejects forged signatures', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    const picker = page.getByLabel('Pilih dokumen PO')
    await picker.setInputFiles({
        name: 'empty.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(0),
    })
    await expect(page.getByText('Ukuran file harus lebih dari 0 dan maksimal 5 MiB.')).toBeVisible()
    await picker.setInputFiles(png)
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Batal', exact: true }).click()
    await picker.setInputFiles({
        name: 'forged.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('not a PDF'),
    })
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(
        page.getByText('File belum dapat diterima. Periksa file lalu pilih kembali.'),
    ).toBeVisible()
    await expect(page.getByText('Belum ada dokumen PO.')).toBeVisible()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
})
test('retries a committed timeout without duplicating documents and recovers 419 without replay', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    await simulation(page, 'committed-timeout')
    await page.getByLabel('Pilih dokumen PO').setInputFiles(png)
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Coba ulang upload', exact: true })).toBeVisible()
    await expect(page.getByLabel('Pilih dokumen PO')).toBeDisabled()
    await simulation(page, 'success')
    await page.getByRole('button', { name: 'Coba ulang upload', exact: true }).click()
    await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unduh dokumen' })).toHaveCount(1)
    await simulation(page, 'csrf')
    await page.getByLabel('Pilih dokumen PO').setInputFiles({ ...png, name: 'second.png' })
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Sesi keamanan diperbarui. Silakan ulangi upload.')).toBeVisible()
    await expect(page.getByText('second.png', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unduh dokumen' })).toHaveCount(1)
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unduh dokumen' })).toHaveCount(2)
})
test('hides upload for a reviewer with read and download access', async ({ page }) => {
    await login(page, 'supervisor@woodflow.test', path)
    await expect(page.getByText('Belum ada dokumen PO.')).toBeVisible()
    await expect(page.getByLabel('Pilih dokumen PO')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Unggah dokumen', exact: true })).toHaveCount(0)
})
test('retains failed upload drafts for access errors and clears the session on 401', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', path)
    for (const [scenario, message] of [
        ['forbidden', 'Anda tidak memiliki izin untuk dokumen ini.'],
        ['not-found', 'Dokumen atau PO tidak ditemukan dalam akses Anda.'],
        ['conflict', 'Upload mengalami konflik. Muat ulang dokumen dan pilih kembali file.'],
    ]) {
        await simulation(page, scenario)
        await page.getByLabel('Pilih dokumen PO').setInputFiles(png)
        await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
        await expect(page.getByText(message, { exact: true }).first()).toBeVisible()
        await expect(page.getByText(png.name, { exact: true })).toBeVisible()
        await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toHaveCount(0)
        await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    }
    await simulation(page, 'unauthenticated')
    await page.getByLabel('Pilih dokumen PO').setInputFiles(png)
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    await expect(page.getByText(png.name, { exact: true })).toHaveCount(0)
})
