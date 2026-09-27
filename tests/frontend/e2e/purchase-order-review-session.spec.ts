import { expect, test } from '@playwright/test'
import type * as SessionControlsModule from '../../../resources/js/src/api/mocks/session-controls'
import { login } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO review failures and permissions')
for (const scenario of ['validation', 'forbidden', 'not-found', 'unauthenticated'] as const) {
    test(`preserves review integrity after ${scenario}`, async ({ page }) => {
        await login(page, 'admin@woodflow.test', '/app/purchase-orders/demo-po-02')
        await page
            .locator('details')
            .filter({ hasText: 'Simulasi persisten' })
            .locator('summary')
            .click()
        await page.getByLabel('Operasi simulasi').selectOption('update')
        await page.getByLabel('Skenario operasi').selectOption(scenario)
        await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
        await page.getByLabel('Alasan penolakan', { exact: true }).fill('Perbaiki rincian')
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Konfirmasi', exact: true })
            .click()
        if (scenario === 'unauthenticated') {
            await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
            await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveCount(0)
            return
        }
        const messages = {
            validation: 'Periksa field yang ditandai. Draft Anda tetap tersedia.',
            forbidden: 'Anda tidak memiliki izin untuk aksi ini.',
            'not-found': 'PO tidak ditemukan atau tidak dapat diakses.',
        }
        await expect(page.getByText(messages[scenario], { exact: true })).toBeVisible()
        await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveValue(
            'Perbaiki rincian',
        )
        await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
        if (scenario === 'validation')
            await expect(
                page.getByText('Isi alasan penolakan dengan 1 sampai 2.000 karakter.'),
            ).toBeVisible()
    })
}

test('drops review draft and record when permissions are revoked during CSRF recovery', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders/demo-po-02')
    await page
        .locator('details')
        .filter({ hasText: 'Simulasi persisten' })
        .locator('summary')
        .click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page.evaluate(async () => {
        const source = new URL(
            '/resources/js/src/api/mocks/session-controls.ts',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { sessionScenario } = (await import(source)) as typeof SessionControlsModule
        sessionScenario.value = 'revoked'
    })
    await page.getByRole('button', { name: 'Tolak PO', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Draft privat reviewer')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Akses tidak diizinkan' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Purchase Order', exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'DEMO-PO-02', exact: true })).toHaveCount(0)
})

test('hides review actions from Maker and an Admin submitter', async ({ page }) => {
    await login(page, 'maker@woodflow.test', '/app/purchase-orders/demo-po-02')
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tolak PO', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await page.getByLabel('Email', { exact: true }).fill('admin@woodflow.test')
    await page.getByLabel('Password simulasi', { exact: true }).fill('simulation')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).not.toBeVisible()
    await page.goto('/app/purchase-orders/demo-po-26')
    await page.getByRole('button', { name: 'Submit PO', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tolak PO', exact: true })).toHaveCount(0)
})
