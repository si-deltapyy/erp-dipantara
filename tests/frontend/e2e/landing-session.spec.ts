import { expect, test } from '@playwright/test'
import { liveLogin } from './live-session-helpers'
import { expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION !== 'true', 'Live Inertia landing session integration')

test('preserves the updated landing and its authenticated Blade navigation', async ({
    page,
}, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kelola Pesanan')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('landing.png'), fullPage: true })
    await liveLogin(page)
    await page.goto('/')
    if ((page.viewportSize()?.width ?? 1440) < 768)
        await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click()
    await page
        .getByRole('link', { name: 'Dashboard', exact: true })
        .filter({ visible: true })
        .click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/')
    if ((page.viewportSize()?.width ?? 1440) < 768)
        await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click()
    await page
        .getByRole('button', { name: 'Logout', exact: true })
        .filter({ visible: true })
        .click()
    await expect(
        page.getByRole('link', { name: 'Masuk', exact: true }).filter({ visible: true }),
    ).toBeVisible()
    expect(errors).toEqual([])
})
