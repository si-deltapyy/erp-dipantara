import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../closing-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Closing mock')
test('evaluates received quantities and approved settlement before exposing closing eligibility', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createClosingScenario } = (await import(
            origin + '/tests/frontend/closing-scenario.ts'
        )) as typeof ScenarioModule
        const { context, closings, ...result } = await createClosingScenario()
        const missing = await closings
            .eligibility(context.admin, 'missing-po', context.signal)
            .catch((cause: { kind: string }) => cause.kind)
        return { ...result, missing, poId: context.po.id }
    })
    expect(result.initial.eligible).toBe(false)
    expect(result.initial.reasons).toEqual(['buyer_invoice_missing', 'mitra_invoice_missing'])
    expect(result.unpaid.reasons).toContain('buyer_outstanding')
    expect(result.pending.openWorkCount).toBe(1)
    expect(result.pending.summary.receivable.approvedCredit).toBe('0.00')
    expect(result.eligible.reasons).toEqual([])
    expect(result.eligible.allowedActions).toEqual(['request'])
    expect(result.eligible.quantities).toEqual({
        ordered: 500,
        assigned: 500,
        approved: 500,
        received: 500,
    })
    expect(result.eligible.summary.receivable.approvedCredit).toBe('1700000.00')
    expect(result.makerView.allowedActions).toEqual([])
    expect(result.onlyClosing.summary).toEqual(result.eligible.summary)
    expect(result.onlyClosing.allowedActions).toEqual([])
    expect(result.failures).toEqual(['forbidden', 'forbidden'])
    expect(result.missing).toBe('not-found')
    expect(result.wrongProduct.reasons).toContain('assignments_incomplete')
    expect(result.wrongAssignment.reasons).toEqual(['grading_incomplete', 'deliveries_incomplete'])
    expect(result.noShipment.reasons).toContain('deliveries_incomplete')
    expect(result.eligible.snapshotToken).not.toBe(result.initial.snapshotToken)
    await login(page, 'admin@woodflow.test', `/app/purchase-orders/${result.poId}`)
    const panel = page.getByRole('region', { name: 'Kelayakan closing' })
    await expect(panel.getByText('PO memenuhi prasyarat closing', { exact: true })).toBeVisible()
    await panel.getByRole('button', { name: 'Muat ulang', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(panel.getByText('PO memenuhi prasyarat closing', { exact: true })).toBeVisible()
    await page.reload()
    await expect(panel.getByText('0 pekerjaan atau revisi masih terbuka')).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        fullPage: true,
        path: `../docs/evidence/sprint-11a/eligibility-${info.project.name}.png`,
    })
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'user@woodflow.test', `/app/purchase-orders/${result.poId}`)
    await expect(
        page.getByRole('heading', { name: 'Ringkasan settlement PO', exact: true }),
    ).toBeVisible()
    await expect(panel).toHaveCount(0)
})
