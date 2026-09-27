import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
export async function prepareGradingAssignment(page: Page): Promise<void> {
    await login(page, 'maker@woodflow.test', '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('button', { name: 'Tambah alokasi', exact: true }).click()
    await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-01')
    await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-01')
    await page.getByLabel('Kayu', { exact: true }).selectOption('demo-timber-01')
    await page.getByLabel('Jumlah alokasi', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
    await page.getByRole('button', { name: 'Submit order', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    const orderUrl = page.url()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', orderUrl)
    await page.getByRole('button', { name: 'Setujui order', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', '/app/assignments')
    await page.getByRole('link', { name: 'Buka penugasan', exact: true }).click()
    await page.getByRole('link', { name: 'Tambah grading', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tambah grading', exact: true })).toBeVisible()
    await expect(page.getByLabel('Jumlah batang', { exact: true })).toBeVisible()
}
export async function saveGradingDraft(page: Page): Promise<void> {
    await page.getByLabel('Jumlah batang', { exact: true }).fill('2')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('25')
    await page.getByLabel('Panjang (m)', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail grading', exact: true })).toBeVisible()
}
export async function submitGrading(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Submit grading', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
}
