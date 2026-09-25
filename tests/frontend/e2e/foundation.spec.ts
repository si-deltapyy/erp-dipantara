import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { liveLogin } from './live-session-helpers'

const production = process.env.E2E_PRODUCTION === 'true'

test.beforeEach(async ({ page }) => {
    if (!production)
        await page.addInitScript(() =>
            sessionStorage.setItem('woodflow.mock.session', 'admin-demo'),
        )
})

async function expectNoOverflow(page: Page): Promise<void> {
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow).toBe(false)
}

test('loads the shell and resolves nested refresh without console errors', async ({
    page,
}, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
    })
    if (production) await liveLogin(page)
    await page.goto('/app')
    await expect(page.getByRole('heading', { name: 'Ruang kerja operasional kayu.' })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('home.png'), fullPage: true })
    await page.goto('/app/missing/nested')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke beranda' }).click()
    await expect(page).toHaveURL(/\/app\/$/)
    expect(errors).toEqual([])
})

test('preserves the landing and legacy authentication routes', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if ((page.viewportSize()?.width ?? 1440) < 768) await page.locator('header button').click()
    await page.getByRole('link', { name: 'Masuk', exact: true }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel('Email')).toBeVisible()
    for (const path of ['/', '/login', '/dashboard', '/profile']) {
        const response = await page.goto(path)
        expect(response?.status()).toBe(200)
        if (['/dashboard', '/profile'].includes(path)) await expect(page).toHaveURL(/\/login$/)
    }
    expect(errors).toEqual([])
})

test('supports keyboard navigation and returns focus when the drawer closes', async ({
    page,
}, info) => {
    test.skip(info.project.name !== 'mobile', 'Mobile drawer only')
    if (production) await liveLogin(page)
    await page.goto('/app')
    const trigger = page.getByRole('button', { name: 'Buka navigasi' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Navigasi utama' })
    await expect(drawer).toBeVisible()
    for (let index = 0; index < 6; index += 1) {
        await page.keyboard.press('Tab')
        expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    await page.screenshot({ path: info.outputPath('navigation.png'), fullPage: true })
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await expectNoOverflow(page)
})

test('renders deterministic mock states and recovers after a failure', async ({ page }, info) => {
    test.skip(production, 'Mock lab is excluded from production')
    await page.goto('/app/development/mock')
    await page.reload()
    await expect(page.getByText('Mode mock', { exact: true })).toBeVisible()
    await expect(page.getByText('Sampel sintetis 001', { exact: true })).toBeVisible()
    const selector = page.getByLabel('Skenario respons')
    const scenarios = {
        empty: 'Tidak ada sampel untuk ditampilkan.',
        validation: 'Pilihan skenario tidak dapat diproses.',
        unauthenticated: 'Sesi telah berakhir.',
        forbidden: 'Anda tidak memiliki akses.',
        'not-found': 'Sampel tidak ditemukan.',
        conflict: 'Ada perubahan yang perlu dimuat ulang.',
        network: 'Koneksi terputus. Silakan coba lagi.',
        unexpected: 'Layanan belum dapat memproses permintaan.',
    }
    for (const [scenario, message] of Object.entries(scenarios)) {
        await selector.selectOption(scenario)
        await expect(page.getByText(message, { exact: true })).toBeVisible()
    }
    await page.screenshot({ path: info.outputPath('error.png'), fullPage: true })
    await selector.selectOption('slow')
    await expect(page.getByText('Memuat sampel…')).toBeVisible()
    await selector.selectOption('empty')
    await expect(page.getByText('Tidak ada sampel untuk ditampilkan.')).toBeVisible()
    await expect(page.getByText('Sampel sintetis 001', { exact: true })).toHaveCount(0)
    await selector.selectOption('success')
    await expect(page.getByText('Sampel sintetis 001', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Muat ulang' }).click()
    await expect(page.getByText('Sampel sintetis 001', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('mock.png'), fullPage: true })
})

test('does not expose the mock lab in production', async ({ page }) => {
    test.skip(!production, 'Production bundle only')
    await page.goto('/app/development/mock')
    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    await expect(page.getByText('Mode mock', { exact: true })).toHaveCount(0)
})
