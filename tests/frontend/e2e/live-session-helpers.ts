import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
export async function liveLogin(page: Page): Promise<void> {
    await page.goto('/app')
    await page.getByLabel('Email', { exact: true }).fill('browser@woodflow.test')
    const password = process.env.E2E_AUTH_PASSWORD
    if (!password) throw new Error('Browser test password is unavailable')
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByText('Browser Test User', { exact: true })).toBeVisible()
}
