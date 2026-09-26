import { expect, test } from '@playwright/test'
import type * as RouterModule from '../../../resources/js/src/router'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO navigation and paged lookups')
test('shows the permitted menu and keeps selected labels beyond the initial lookup page', async ({
    page,
}, info) => {
    await login(page, 'user@woodflow.test', '/app/purchase-orders')
    if (info.project.name === 'mobile')
        await page.getByRole('button', { name: 'Buka navigasi' }).click()
    await expect(
        page.getByRole('link', { name: 'Purchase Order', exact: true }).filter({ visible: true }),
    ).toBeVisible()
    if (info.project.name === 'mobile') await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Tambah PO', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Muat pilihan berikutnya' })).toHaveCount(2)
    await page.getByRole('button', { name: 'Muat pilihan berikutnya' }).first().click()
    await page.getByLabel('Buyer', { exact: true }).selectOption('demo-buyer-24')
    await page.getByRole('button', { name: 'Muat pilihan berikutnya' }).last().click()
    await page.getByLabel('Kayu baris 1', { exact: true }).selectOption('demo-timber-24')
    await page.getByLabel('Cari Buyer', { exact: true }).fill('Simulasi 01')
    await page.getByLabel('Cari Buyer', { exact: true }).press('Enter')
    await expect(page.getByLabel('Buyer', { exact: true })).toHaveValue('demo-buyer-24')
    await page.getByLabel('Nomor PO', { exact: true }).fill('DEMO-PAGED')
    await page.getByLabel('Tanggal PO', { exact: true }).fill('2026-09-26')
    await page.getByLabel('Harga satuan baris 1', { exact: true }).fill('100.00')
    const width = await page
        .getByLabel('Cari Buyer', { exact: true })
        .evaluate((element) => element.getBoundingClientRect().width)
    expect(width).toBeGreaterThan(120)
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('purchase-order-form.png'), fullPage: true })
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('link', { name: 'Edit PO', exact: true }).click()
    await expect(page.getByLabel('Buyer', { exact: true })).toHaveValue('demo-buyer-24')
    await expect(page.getByLabel('Kayu baris 1', { exact: true })).toHaveValue('demo-timber-24')
})
test('confirms dirty navigation between IDs on the same edit route', async ({ page }) => {
    await login(page, 'user@woodflow.test', '/app/purchase-orders/demo-po-01/edit')
    await page.getByLabel('Catatan', { exact: true }).fill('Keep this draft')
    await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/router/index.ts',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { router } = (await import(base)) as typeof RouterModule
        void router.push('/purchase-orders/demo-po-06/edit')
    })
    await expect(page.getByRole('dialog', { name: 'Buang perubahan?' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await expect(page.getByLabel('Catatan', { exact: true })).toHaveValue('Keep this draft')
    await expect(page).toHaveURL(/demo-po-01\/edit/)
})
