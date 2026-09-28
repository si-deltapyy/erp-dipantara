import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../settlement-scenario'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Settlement monitoring mock')
test('reconciles a new 500 unit PO, received shipments, invoice revisions and distinct approved payments', async ({
    page,
}, info) => {
    test.setTimeout(120000)
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createSettlementScenario, issueSettlementInvoice, submitSettlementPayment } =
            (await import(
                origin + '/tests/frontend/settlement-scenario.ts'
            )) as typeof ScenarioModule
        const context = await createSettlementScenario('woodflow-demo')
        const { invoices, payments, owner, maker, supervisor, generation, signal, po } = context
        const invoice = await issueSettlementInvoice(
            context,
            'receivable',
            'settlement',
            '2000000.00',
        )
        const first = await submitSettlementPayment(context, invoice, '1000000.00')
        await payments.mutate(
            supervisor,
            {
                action: 'approve',
                id: first.id,
                input: { version: first.version },
                key: 'first-credit',
            },
            generation,
            signal,
        )
        const draft = await invoices.mutate(
            maker,
            {
                action: 'revise',
                id: invoice.id,
                input: {
                    version: invoice.version,
                    reason: 'Final settlement',
                    terms: [{ label: 'Final amount', amount: '1700000.00', dueDate: '2026-09-01' }],
                },
                key: 'revision',
            },
            generation,
            signal,
        )
        const before = await invoices.summary(owner, po.id, signal)
        const revised = await invoices.mutate(
            maker,
            {
                action: 'issue',
                id: draft.id,
                input: { version: draft.version, revisionNumber: draft.revisionNumber },
                key: 'reissue',
            },
            generation,
            signal,
        )
        const second = await submitSettlementPayment(context, revised, '700000.00')
        await payments.mutate(
            supervisor,
            {
                action: 'approve',
                id: second.id,
                input: { version: second.version },
                key: 'second-credit',
            },
            generation,
            signal,
        )
        const dp = await issueSettlementInvoice(context, 'payable', 'down_payment', '100000.00')
        const dpPayment = await submitSettlementPayment(context, dp, '100000.00')
        await payments.mutate(
            supervisor,
            {
                action: 'approve',
                id: dpPayment.id,
                input: { version: dpPayment.version },
                key: 'dp-credit',
            },
            generation,
            signal,
        )
        const summary = await invoices.summary(owner, po.id, signal)
        const pageOne = await payments.list(
            owner,
            { page: 1, perPage: 1, search: '', sort: 'createdAt', invoiceId: invoice.id },
            signal,
        )
        const pageTwo = await payments.list(
            owner,
            { page: 2, perPage: 1, search: '', sort: 'createdAt', invoiceId: invoice.id },
            signal,
        )
        const failures: string[] = []
        for (const actor of [{ ...owner, id: 'multiple-demo' }, context.grader]) {
            try {
                await invoices.summary(actor, po.id, signal)
                failures.push('unexpected')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        return {
            poId: po.id,
            orderId: context.order.id,
            invoiceId: invoice.id,
            shipped: context.shipments.map((shipment) => shipment.allocations[0]?.quantity),
            statuses: context.shipments.map((shipment) => shipment.status),
            before: before.receivable,
            summary,
            payments: [...pageOne.data, ...pageTwo.data].map((payment) => payment.creditAmount),
            total: pageOne.meta.total,
            failures,
        }
    })
    expect(result).toMatchObject({
        shipped: [200, 200, 100],
        statuses: ['received', 'received', 'received'],
        before: { invoiceAmount: '2000000.00', outstandingAmount: '1000000.00' },
        summary: {
            receivable: {
                issuedInvoiceCount: 1,
                invoiceAmount: '1700000.00',
                approvedCredit: '1700000.00',
                outstandingAmount: '0.00',
                overdueAmount: '0.00',
            },
            payable: {
                downPayment: {
                    issuedInvoiceCount: 1,
                    approvedCredit: '100000.00',
                    outstandingAmount: '0.00',
                },
            },
        },
        payments: ['1000000.00', '700000.00'],
        total: 2,
        failures: ['not-found', 'forbidden'],
    })
    await login(page, 'user@woodflow.test', '/app/purchase-orders/' + result.poId)
    await expect(
        page.getByRole('heading', { name: 'Ringkasan settlement PO', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('DP lunas', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('DP lunas', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'maker@woodflow.test', '/app/orders/' + result.orderId)
    await expect(
        page.getByRole('heading', { name: 'Status DP Buyer dan Mitra', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('DP lunas', { exact: true })).toBeVisible()
    await page.goto('/app/invoices/' + result.invoiceId)
    await page.getByRole('link', { name: 'Pantau pembayaran', exact: true }).click()
    await expect(page.getByText('2 pembayaran', { exact: true })).toBeVisible()
    await expect(page.getByText('Rp 1.000.000,00', { exact: true })).toBeVisible()
    await expect(page.getByText('Rp 700.000,00', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        path: '../docs/evidence/sprint-10d/settlement-' + info.project.name + '.png',
        fullPage: true,
    })
})
