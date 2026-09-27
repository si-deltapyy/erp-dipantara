import { test, expect } from '@playwright/test'
import { login, scenario, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Mock session only')

test('validates login, restores a session, logs out, and separates accounts', async ({
    page,
}, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/app')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('alert').first()).toBeFocused()
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await page.screenshot({ path: info.outputPath('login-validation.png'), fullPage: true })
    await login(page)
    await expect(page.getByText('Admin Simulasi', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Admin Simulasi', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('woodflow.mock.session'))).toBe(
        'admin-demo',
    )
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('woodflow.mock.session'))).toBeNull()
    await login(page, 'grader1@woodflow.test')
    await expect(page.getByText('Grader Simulasi 01', { exact: true })).toBeVisible()
    await expect(page.getByText('Admin Simulasi', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Pengujian mock' })).toHaveCount(0)
    await expectNoOverflow(page)
    expect(errors).toEqual([])
})

test('uses allowed internal destinations and rejects forbidden routes while allowing new roles a basic workspace', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/development/ui')
    await expect(page).toHaveURL(/\/app\/development\/ui$/)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader2@woodflow.test', '/app/development/ui')
    await expect(page).toHaveURL(/\/app\/$/)
    await page.goto('/app/development/ui')
    await expect(page.getByRole('heading', { name: 'Akses tidak diizinkan' })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'unknown@woodflow.test')
    await expect(page.getByText('Akun Tanpa Izin', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pengujian mock' })).toHaveCount(0)
})

test('recovers from credentials, validation and network failures without storing passwords', async ({
    page,
}) => {
    await page.goto('/app/login?returnTo=https://outside.test')
    for (const label of ['Credentials salah', 'Validasi server', 'Koneksi terputus']) {
        await scenario(page, label)
        await page.getByLabel('Email', { exact: true }).fill('admin@woodflow.test')
        await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
        await page.getByRole('button', { name: 'Masuk', exact: true }).click()
        await expect(page.getByRole('alert').first()).toBeVisible()
        await expect(page.getByLabel('Password simulasi', { exact: true })).toHaveValue('')
        expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
    }
    await scenario(page, 'Normal')
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/$/)
})

test('handles bootstrap failure and session expiry without exposing previous identity', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/development/ui')
    await scenario(page, 'Koneksi terputus')
    await page.getByRole('button', { name: 'Periksa ulang sesi' }).click()
    await expect(page.getByRole('heading', { name: 'Sesi belum dapat dimuat.' })).toBeVisible()
    await expect(page.getByText('Admin Simulasi', { exact: true })).toHaveCount(0)
    await scenario(page, 'Normal')
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByText('Admin Simulasi', { exact: true })).toBeVisible()
    await page.goto('/app/development/ui')
    await scenario(page, 'Sesi berakhir')
    await page.getByRole('button', { name: 'Periksa ulang sesi' }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('woodflow.mock.session'))).toBeNull()
})

test('keeps failed logout retryable and prevents duplicate slow login', async ({ page }) => {
    await page.goto('/app/login')
    await scenario(page, 'Respons lambat')
    await page.getByLabel('Email', { exact: true }).fill('admin@woodflow.test')
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeDisabled()
    await expect(page.getByText('Admin Simulasi', { exact: true })).toBeVisible()
    await page.goto('/app/development/ui')
    await scenario(page, 'Logout gagal')
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Koneksi terputus')
    await expect(page.getByText('Admin Simulasi', { exact: true })).toBeVisible()
    await scenario(page, 'Normal')
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
})

test('removes access immediately when mock permissions are revoked', async ({ page }) => {
    await login(page, 'admin@woodflow.test', '/app/development/ui')
    await scenario(page, 'Izin dicabut')
    await page.getByRole('button', { name: 'Periksa ulang sesi' }).click()
    await expect(page.getByRole('heading', { name: 'Akses tidak diizinkan' })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke beranda' }).click()
    await expect(page.getByRole('link', { name: 'Komponen antarmuka' })).toHaveCount(0)
})
