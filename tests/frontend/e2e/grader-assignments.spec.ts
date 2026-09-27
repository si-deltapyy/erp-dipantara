import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Assignment mock workflow')

test('shows only current assignments across Grader sessions and removes reassigned access', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Tambah alokasi', exact: true })).toBeVisible()
    const orderPath = new URL(page.url()).pathname
    for (const suffix of ['01', '02']) {
        await page.getByRole('button', { name: 'Tambah alokasi', exact: true }).click()
        await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-' + suffix)
        await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-' + suffix)
        await page.getByLabel('Kayu', { exact: true }).selectOption('demo-timber-01')
        await page.getByLabel('Jumlah alokasi', { exact: true }).fill('1')
        await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
        await expect(
            page.getByRole('button', { name: 'Tambah alokasi', exact: true }),
        ).toBeVisible()
    }
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', '/app/assignments')
    await expect(page.getByRole('link', { name: 'Buka penugasan', exact: true })).toHaveCount(1)
    await expect(page.locator('main')).not.toContainText('Mitra Simulasi 02')
    await page.getByRole('link', { name: 'Buka penugasan', exact: true }).click()
    await expect(page.getByText('Mitra Simulasi 01', { exact: true })).toBeVisible()
    const assignmentPath = new URL(page.url()).pathname
    await page.reload()
    await expect(page.getByText('Kayu Simulasi 01', { exact: true })).toBeVisible()
    await expect(page.locator('main')).not.toContainText('Rp')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('grader-assignment.png'), fullPage: true })
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader2@woodflow.test', assignmentPath)
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('Mitra Simulasi 01')
    await page.goto('/app/assignments')
    await expect(page.getByRole('link', { name: 'Buka penugasan', exact: true })).toHaveCount(1)
    await expect(page.locator('main')).toContainText('Mitra Simulasi 02')
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'maker@woodflow.test', orderPath)
    await page.getByRole('button', { name: 'Edit alokasi', exact: true }).first().click()
    await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-02')
    await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Tambah alokasi', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', assignmentPath)
    await expect(page.getByRole('alert')).toBeVisible()
    await page.goto('/app/assignments')
    await expect(page.getByText('Belum ada alokasi.', { exact: true })).toBeVisible()
})
