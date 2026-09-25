import { test, expect } from '@playwright/test'
import { liveLogin } from './live-session-helpers'
import { expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION !== 'true', 'Live production bundle only')

test('logs in through Breeze, restores cookies, and logs in again after logout', async ({
    page,
}, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await liveLogin(page)
    await page.reload()
    await expect(page.getByTestId('persistent-demo')).toHaveCount(0)
    expect(
        await page.evaluate(async () =>
            (await indexedDB.databases()).some((database) => database.name === 'woodflow-demo'),
        ),
    ).toBe(false)
    await expect(page.getByText('Browser Test User', { exact: true })).toBeVisible()
    const snapshot = await (await page.request.get('/auth/session')).json()
    expect(snapshot.user.roles).toEqual(['future'])
    expect(snapshot.user.permissions).toEqual(['view reports'])
    expect(Object.keys(snapshot.user).sort()).toEqual(['displayName', 'id', 'permissions', 'roles'])
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('live-workspace.png'), fullPage: true })
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    expect((await (await page.request.get('/auth/session')).json()).user).toBeNull()
    await liveLogin(page)
    expect(await page.evaluate(() => sessionStorage.getItem('woodflow.mock.session'))).toBeNull()
    expect(errors).toEqual([])
})

test('shows live validation and recovers from an expired CSRF cookie without replay', async ({
    page,
}, info) => {
    await page.goto('/app/login')
    await page.getByLabel('Email', { exact: true }).fill('browser@woodflow.test')
    await page.getByLabel('Password', { exact: true }).fill('invalid')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
    await page.screenshot({ path: info.outputPath('live-validation.png'), fullPage: true })
    await page
        .context()
        .addCookies([{ name: 'XSRF-TOKEN', value: 'expired', url: 'http://127.0.0.1:8011' }])
    await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_AUTH_PASSWORD ?? '')
    const rejected = page.waitForResponse(
        (response) => response.url().endsWith('/login') && response.status() === 419,
    )
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await rejected
    await expect(page.getByRole('alert').first()).toContainText('Sesi keamanan telah diperbarui')
    expect((await (await page.request.get('/auth/session')).json()).user).toBeNull()
    await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_AUTH_PASSWORD ?? '')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByText('Browser Test User', { exact: true })).toBeVisible()
})

test('excludes mock labs and controls while protecting the live workspace', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL(/\/app\/login/)
    await expect(page.getByText('Pengaturan simulasi', { exact: true })).toHaveCount(0)
    for (const path of ['/app/development/ui', '/app/development/mock']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
        await expect(page.getByText('Mode mock', { exact: true })).toHaveCount(0)
    }
})

test('retains identity after a failed logout and handles an expired server session', async ({
    page,
}) => {
    await liveLogin(page)
    await page.route('**/logout', (route) => route.abort())
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Koneksi terputus')
    await expect(page.getByText('Browser Test User', { exact: true })).toBeVisible()
    await page.unroute('**/logout')
    await page.context().clearCookies()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    await expect(page.getByText('Browser Test User', { exact: true })).toHaveCount(0)
})
