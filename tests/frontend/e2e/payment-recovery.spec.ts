import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import { login } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment recovery mock')
async function scenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test('recovers payment fields and proof after upload 419 and replays committed payment once', async ({
    page,
}) => {
    await page.goto('/app')
    const invoiceId = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        return (await createPaymentScenario('woodflow-demo')).invoice.id
    })
    await login(page, 'admin@woodflow.test', '/app/payments/new?invoiceId=' + invoiceId)
    await page.getByLabel('Rekening sumber', { exact: true }).selectOption('demo-bank-account-02')
    await page.getByLabel('Rekening tujuan', { exact: true }).selectOption('demo-bank-account-01')
    await page.getByLabel('Nominal cash', { exact: true }).fill('700000.00')
    await page.getByRole('link', { name: 'Batal', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Buang perubahan?' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await page.getByLabel('Pilih bukti pembayaran', { exact: true }).setInputFiles({
        name: 'recover.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\nRecovery\n%%EOF'),
    })
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(
        page.getByText('Sesi diperbarui. Periksa draft sebelum mencoba kembali.', { exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Nominal cash', { exact: true })).toHaveValue('700000.00')
    await expect(page.getByText('recover.pdf', { exact: true })).toBeVisible()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
    await expect(page.getByText('Bukti sudah tersedia.', { exact: true })).toBeVisible()
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Sesi diperbarui. Periksa draft sebelum mencoba kembali.', { exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Nominal cash', { exact: true })).toHaveValue('700000.00')
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Nominal cash', { exact: true })).toBeDisabled()
    await scenario(page, 'success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Detail pembayaran', exact: true }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByText('1 pembayaran', { exact: true })).toBeVisible()
})

test('review recovers after 419 and retries committed approval without applying credit twice', async ({
    page,
}) => {
    await page.goto('/app')
    const id = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario, createSubmittedPayment } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        const context = await createPaymentScenario('woodflow-demo')
        return (await createSubmittedPayment(context, context.owner, '1000000.00')).id
    })
    await login(page, 'admin@woodflow.test', '/app/payments/' + id)
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa keputusan lalu konfirmasi kembali.', {
            exact: true,
        }),
    ).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Ulangi permintaan', exact: true }),
    ).toBeVisible()
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Ulangi permintaan', exact: true })
        .click()
    await expect(
        page.getByRole('dialog').getByText('Koneksi terputus. Silakan coba lagi.', { exact: true }),
    ).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /^DEMO-INV/ }).click()
    await expect(page.getByText('Rp 700.000,00', { exact: true }).first()).toBeVisible()
})
