import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../closing-review-scenario'
import type { Page } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Closing review mock')
async function prepare(page: Page, separateCreator = false): Promise<string> {
    await page.goto('/app')
    return page.evaluate(async (separateCreator) => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createRequestedClosing } = (await import(
            origin + '/tests/frontend/closing-review-scenario.ts'
        )) as typeof ScenarioModule
        return (await createRequestedClosing(separateCreator)).closing.id
    }, separateCreator)
}
async function scenario(page: Page, value: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(value)
}
test('rechecks late invoices and atomically reviews closing with self-review, rollback and race guards', async ({
    page,
}) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { exerciseClosingReview } = (await import(
            origin + '/tests/frontend/closing-review-scenario.ts'
        )) as typeof ScenarioModule
        return exerciseClosingReview()
    })
    expect(result.failures).toEqual(['forbidden', 'conflict', 'validation', 'rollback', 'conflict'])
    expect(result.rollback).toEqual({ closing: 'requested', po: 'approved' })
    expect(result.next.id).not.toBe(result.rejected.id)
    expect(result.successes).toBe(1)
    expect(result.conflicts).toEqual(['conflict'])
    expect(result.replay.status).toBe('approved')
    expect(result.final).toEqual({ po: 'closed', old: 'Settle the new invoice', closeAudits: 1 })
    expect(result.history.meta.total).toBe(2)
})
test('recovers closing approval after CSRF and reconciles a committed timeout', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    const id = await prepare(page, true)
    await login(page, 'admin@woodflow.test', '/app/closings/' + id)
    await scenario(page, 'csrf')
    await page.getByRole('button', { name: 'Setujui closing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa keputusan lalu konfirmasi kembali.', {
            exact: true,
        }),
    ).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click()
    await scenario(page, 'committed-timeout')
    await page.getByRole('button', { name: 'Setujui closing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Ulangi permintaan', exact: true })
        .click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Koneksi terputus')
    await page.getByRole('dialog').getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui closing', exact: true })).toHaveCount(0)
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        path: `../docs/evidence/sprint-11b/review-${info.project.name}.png`,
        fullPage: true,
    })
    await page.getByRole('link', { name: 'Buka PO', exact: true }).click()
    await expect(page.getByText('Ditutup', { exact: true })).toBeVisible()
})
test('denies self-review in the UI and requires a rejection reason from another reviewer', async ({
    page,
}) => {
    test.setTimeout(120000)
    const id = await prepare(page)
    await login(page, 'admin@woodflow.test', '/app/closings/' + id)
    await expect(page.getByRole('heading', { name: 'Detail closing', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui closing', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', '/app/closings/' + id)
    await page.getByRole('button', { name: 'Tolak closing', exact: true }).click()
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toBeFocused()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Isi alasan penolakan dengan 1 sampai 2.000 karakter.', { exact: true }),
    ).toBeVisible()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Periksa kembali dokumen')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Periksa kembali dokumen', { exact: true })).toBeVisible()
})
