import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../review-dashboard-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Review dashboard mock')

test('scopes actionable review queues and refreshes after a decision in the closing module', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const scenario = (await import(
            origin + '/tests/frontend/review-dashboard-scenario.ts'
        )) as typeof ScenarioModule
        return scenario.exerciseReviewDashboard()
    })
    expect(result.first.meta.total).toBe(21)
    expect(result.first.data).toHaveLength(1)
    expect(result.second.data[0]?.id).not.toBe(result.first.data[0]?.id)
    expect(result.self.meta.total).toBe(0)
    expect(result.denied).toBe('forbidden')
    expect(result.limited.queues.filter((queue) => queue.kind.endsWith('-review'))).toEqual([])
    for (const page of result.pages) {
        expect(page.meta.total).toBeGreaterThan(0)
        expect(
            page.data.every((record) => ['submitted', 'requested'].includes(record.status)),
        ).toBe(true)
        expect(
            page.data.every((record) => !('amount' in record) && !('proofDocumentId' in record)),
        ).toBe(true)
        const resource = page.data[0]?.resource
        expect(
            result.before.queues.find((queue) => queue.kind === resource + '-review')?.count,
        ).toBe(page.meta.total)
    }
    for (const kind of ['orders-review', 'gradings-review', 'payments-review'])
        expect(result.closed.queues.find((queue) => queue.kind === kind)?.count).toBe(0)
    await login(page, 'supervisor@woodflow.test')
    await expect(page.getByTestId('queue-closings-review')).toContainText('1')
    await expectNoOverflow(page)
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-12d/review-${info.project.name}.png`,
    })
    await page.getByTestId('queue-purchase-orders-review').click()
    await page.getByLabel('Cari nomor PO atau transaksi').fill('REVIEW-20')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page.getByText('1 pekerjaan', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('1 pekerjaan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke dashboard' }).click()
    await page.getByTestId('queue-closings-review').focus()
    await page.keyboard.press('Enter')
    await page.locator(`a[href="/app/closings/${result.closingId}"]`).click()
    await page.getByRole('button', { name: 'Setujui closing', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByText('Tidak ada pekerjaan yang sesuai.', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
})
