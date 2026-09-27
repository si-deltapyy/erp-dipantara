import type { Page } from '@playwright/test'
export async function fillTimber(page: Page, name: string): Promise<void> {
    await page.getByLabel('Nama Kayu', { exact: true }).fill(name)
    await page.getByLabel('Kode mutu', { exact: true }).fill('TEST')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('20,00')
    await page.getByLabel('Panjang (m)', { exact: true }).fill('2')
    await page.getByLabel('Harga beli (IDR)', { exact: true }).fill('100000,50')
    await page.getByLabel('Harga jual (IDR)', { exact: true }).fill('150000')
}
