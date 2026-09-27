import { expect, test } from '@playwright/test'
import { login } from './session-helpers'

test.use({ channel: 'chromium' })
test.skip(process.env.E2E_PRODUCTION === 'true', 'Synthetic PDF preview')
function syntheticPdf(): Buffer {
    const stream = 'BT /F1 20 Tf 30 130 Td (Synthetic PO document) Tj ET'
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ]
    let pdf = '%PDF-1.4\n'
    const offsets: number[] = []
    for (const [index, object] of objects.entries()) {
        offsets.push(Buffer.byteLength(pdf))
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    }
    const xref = Buffer.byteLength(pdf)
    pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
    return Buffer.from(pdf)
}
test('renders a complete synthetic PDF in the preview', async ({ page }, info) => {
    await login(page, 'maker@woodflow.test', '/app/purchase-orders/demo-po-03')
    await page.getByLabel('Pilih dokumen PO').setInputFiles({
        name: 'synthetic-preview.pdf',
        mimeType: 'application/pdf',
        buffer: syntheticPdf(),
    })
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Pratinjau dokumen' }).click()
    await expect
        .poll(async () => {
            for (const frame of page.frames()) {
                if (!frame.url().startsWith('blob:')) continue
                if (await frame.locator('embed[type="application/x-google-chrome-pdf"]').count())
                    return frame
                        .locator('#sizer')
                        .evaluate((element) => element.getBoundingClientRect().height > 0)
            }
            return false
        })
        .toBe(true)
    await page.screenshot({
        path: info.outputPath('purchase-order-pdf-preview.png'),
        fullPage: false,
    })
})
