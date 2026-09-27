import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import { prepareGradingAssignment, saveGradingDraft, submitGrading } from './grading-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading review mock')
test('reviews submitted measurements, persists rejection reason and approves corrected grading', async ({
    page,
}, info) => {
    await prepareGradingAssignment(page)
    await saveGradingDraft(page)
    await submitGrading(page)
    const gradingUrl = page.url()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', '/app/gradings')
    await page.getByRole('link', { name: 'Menunggu review', exact: true }).click()
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('submitted')
    await page.getByRole('link', { name: 'Buka grading', exact: true }).click()
    await page.getByRole('button', { name: 'Tolak grading', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Periksa diameter aktual')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Alasan penolakan terakhir: Periksa diameter aktual')).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', gradingUrl)
    await page.getByRole('link', { name: 'Edit grading', exact: true }).click()
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('20')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Alasan penolakan terakhir: Periksa diameter aktual')).toBeVisible()
    await submitGrading(page)
    await expect(page.getByText('Alasan penolakan terakhir: Periksa diameter aktual')).toHaveCount(
        0,
    )
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', gradingUrl)
    await page.getByRole('button', { name: 'Setujui grading', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Setujui grading', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expect(page.getByText('Total volume (m3): 0.125664', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('grading-review.png'), fullPage: true })
    await page.goto('/app/gradings?status=submitted')
    await expect(page.getByText('Belum ada grading.', { exact: true })).toBeVisible()
})
