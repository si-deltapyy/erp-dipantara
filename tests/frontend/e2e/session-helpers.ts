import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export async function login(
    page: Page,
    email = 'admin@woodflow.test',
    path = '/app',
): Promise<void> {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).not.toBeVisible()
}
export async function scenario(page: Page, label: string): Promise<void> {
    const details = page.locator('details').filter({ hasText: 'Pengaturan simulasi' })
    if (!(await details.evaluate((element) => element.hasAttribute('open'))))
        await details.locator('summary').click()
    await page.getByLabel('Skenario sesi').selectOption({ label })
}
export async function expectNoOverflow(page: Page): Promise<void> {
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
}
