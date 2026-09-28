import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import { prepareGradingAssignment, saveGradingDraft, submitGrading } from './grading-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading corrections mock')
test('keeps approved measurements until revision review and exposes invoice follow-up to Maker', async ({
    page,
}, info) => {
    await prepareGradingAssignment(page)
    await saveGradingDraft(page)
    await submitGrading(page)
    const originalUrl = page.url()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', originalUrl)
    await page.getByRole('button', { name: 'Setujui grading', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', originalUrl)
    await page.getByRole('link', { name: 'Revisi grading', exact: true }).click()
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByLabel('Alasan revisi', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await page
        .getByLabel('Alasan revisi', { exact: true })
        .fill('Koreksi diameter aktual dari 25 menjadi 20 cm')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('20')
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail grading', exact: true })).toBeVisible()
    const revisionUrl = page.url()
    expect(revisionUrl).not.toBe(originalUrl)
    await expect(page.getByRole('region', { name: 'Hasil sebelumnya', exact: true })).toContainText(
        'Disetujui',
    )
    await expect(page.getByRole('region', { name: 'Hasil sebelumnya', exact: true })).toContainText(
        '0.196350',
    )
    await expect(page.getByRole('region', { name: 'Hasil revisi', exact: true })).toContainText(
        '0.125664',
    )
    await page.reload()
    await expect(
        page.getByText('Alasan revisi: Koreksi diameter aktual dari 25 menjadi 20 cm', {
            exact: true,
        }),
    ).toBeVisible()
    await submitGrading(page)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', revisionUrl)
    await page.getByRole('button', { name: 'Setujui grading', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Hasil sebelumnya', exact: true })).toContainText(
        'Digantikan revisi',
    )
    await expect(
        page.getByText(
            'Hasil berubah. Invoice yang sudah diterbitkan perlu ditinjau untuk revisi.',
            { exact: true },
        ),
    ).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('grading-correction.png'), fullPage: true })
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'maker@woodflow.test', revisionUrl)
    await expect(
        page.getByText(
            'Hasil berubah. Invoice yang sudah diterbitkan perlu ditinjau untuk revisi.',
            { exact: true },
        ),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Revisi grading', exact: true })).toHaveCount(0)
    await page.goto(originalUrl)
    await expect(page.getByText('Digantikan revisi', { exact: true })).toBeVisible()
    await expect(page.getByText('Total volume (m3): 0.196350', { exact: true })).toBeVisible()
})
