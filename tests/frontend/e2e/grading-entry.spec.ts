import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import { prepareGradingAssignment, saveGradingDraft, submitGrading } from './grading-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading mock workflow')
test('validates measurement rows, persists stable rows and submits assigned grading without prices', async ({
    page,
}, info) => {
    await prepareGradingAssignment(page)
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByLabel('Diameter (cm)', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await page.getByLabel('Jumlah batang', { exact: true }).fill('3')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('25')
    await page.getByLabel('Panjang (m)', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Jumlah batang grading melebihi alokasi penugasan.', { exact: true }),
    ).toBeVisible()
    await saveGradingDraft(page)
    const url = page.url()
    await expect(page.getByText('Total volume (m3): 0.196350', { exact: true })).toBeVisible()
    await page.reload()
    await page.getByRole('link', { name: 'Edit grading', exact: true }).click()
    const rowId = await page.getByLabel('Diameter (cm)', { exact: true }).getAttribute('id')
    await page.getByRole('button', { name: 'Tambah baris', exact: true }).click()
    await page.getByRole('button', { name: 'Hapus baris 2', exact: true }).click()
    await expect(page.getByLabel('Diameter (cm)', { exact: true })).toHaveAttribute('id', rowId!)
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('20')
    await page.getByRole('link', { name: 'Batal', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Total volume (m3): 0.125664', { exact: true })).toBeVisible()
    await submitGrading(page)
    await expect(page.getByRole('link', { name: 'Edit grading', exact: true })).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText('Rp')
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('grading-entry.png'), fullPage: true })
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader2@woodflow.test', url)
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('Mitra Simulasi 01')
    await page.goto('/app/gradings')
    await expect(page.getByText('Belum ada grading.', { exact: true })).toBeVisible()
})
