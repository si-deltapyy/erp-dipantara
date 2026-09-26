import { expect, test } from '@playwright/test'
import type * as RouterModule from '../../../resources/js/src/router'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO Admin and Maker workflows')
const path = '/app/purchase-orders'

test('lets Admin edit and submit a foreign rejected PO and locks submitted records', async ({
    page,
}, info) => {
    await login(page, 'admin@woodflow.test', path + '/demo-po-04/edit?status=rejected')
    await expect(page.getByLabel('Nomor PO', { exact: true })).toHaveValue('DEMO-PO-04')
    await page.getByLabel('Catatan', { exact: true }).fill('Diproses Admin untuk pengguna')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail PO', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Diproses Admin untuk pengguna', { exact: true })).toBeVisible()
    const submit = page.getByRole('button', { name: 'Submit PO', exact: true })
    await submit.focus()
    await page.keyboard.press('Enter')
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(submit).toBeFocused()
    await submit.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit PO', exact: true })).toHaveCount(0)
    await expect(submit).toHaveCount(0)
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('purchase-order-admin.png'), fullPage: true })
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page).toHaveURL(/status=rejected/)
    await expect(page.getByRole('cell', { name: 'DEMO-PO-04', exact: true })).toHaveCount(0)
    await page.goto(path + '/demo-po-04/edit')
    await expect(
        page.getByText('PO tidak dapat diedit pada status atau akses saat ini.'),
    ).toBeVisible()
})

test('lets Maker read all owners and retain filters and pagination without write actions', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', path)
    await expect(page.getByText('26 PO', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tambah PO', exact: true })).toHaveCount(0)
    if (info.project.name === 'mobile')
        await page.getByRole('button', { name: 'Buka navigasi' }).click()
    await expect(
        page.getByRole('link', { name: 'Purchase Order', exact: true }).filter({ visible: true }),
    ).toBeVisible()
    if (info.project.name === 'mobile') await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('row').filter({ hasText: 'DEMO-PO-01' }).getByRole('link').click()
    await expect(page.getByRole('heading', { name: 'DEMO-PO-01', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('DEMO-PO-26')
    await page.getByLabel('Status', { exact: true }).selectOption('draft')
    await page.locator('#po-filter-buyer').selectOption('demo-buyer-01')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await expect(page.getByText('1 PO', { exact: true })).toBeVisible()
    const filtered = page.url()
    await page.getByRole('row').filter({ hasText: 'DEMO-PO-26' }).getByRole('link').click()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'DEMO-PO-26', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit PO', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Submit PO', exact: true })).toHaveCount(0)
    await expect(page.getByText('Perusahaan Simulasi 01', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('purchase-order-maker.png'), fullPage: true })
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page).toHaveURL(filtered)
    await page.reload()
    await expect(page.getByText('1 PO', { exact: true })).toBeVisible()
})

test('denies Maker create and edit routes and denies the Grader PO menu', async ({ page }) => {
    await login(page, 'maker@woodflow.test', path)
    for (const route of ['/new', '/demo-po-01/edit']) {
        await page.goto(path + route)
        await expect(page).toHaveURL(/forbidden/)
        await expect(page.getByRole('button', { name: 'Simpan draft', exact: true })).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await page.getByLabel('Email', { exact: true }).fill('grader1@woodflow.test')
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await page.goto(path)
    await expect(page).toHaveURL(/forbidden/)
    await expect(page.getByRole('link', { name: 'Purchase Order', exact: true })).toHaveCount(0)
})

test('cancels an in-flight Admin submit before showing a different PO', async ({ page }) => {
    await login(page, 'admin@woodflow.test', path + '/demo-po-01')
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByRole('button', { name: 'Submit PO', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Submit PO', exact: true })).toBeDisabled()
    await page.evaluate(async () => {
        const source = new URL(
            '/resources/js/src/router/index.ts',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { router } = (await import(source)) as typeof RouterModule
        await router.push('/purchase-orders/demo-po-06')
    })
    await expect(page.getByRole('heading', { name: 'DEMO-PO-06', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit PO', exact: true })).toBeEnabled()
    await page.waitForTimeout(1700)
    await expect(page.getByRole('heading', { name: 'DEMO-PO-06', exact: true })).toBeVisible()
    await expect(page.getByText('Draft', { exact: true })).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
})
