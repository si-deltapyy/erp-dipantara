import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment rollback mock')
test('rolls back approval and credit when the proof fails validation after the status write', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario, createSubmittedPayment } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        const { runDemoTransaction } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const context = await createPaymentScenario()
        const payment = await createSubmittedPayment(context, context.owner, '1000000.00')
        await runDemoTransaction(context.options, ['payments'], 'readwrite', (tx) =>
            tx.put('payments', { ...payment, proofDocumentId: 'injected-invalid-proof' }),
        )
        let failure = ''
        try {
            await context.payments.mutate(
                context.supervisor,
                {
                    action: 'approve',
                    id: payment.id,
                    input: { version: payment.version },
                    key: 'rollback',
                },
                context.generation,
                context.signal,
            )
        } catch (cause) {
            failure = (cause as { kind: string }).kind
        }
        const stored = await context.payments.get(context.owner, payment.id, context.signal)
        const settlement = await context.invoices.settlement(
            context.owner,
            payment.invoiceId,
            context.signal,
        )
        return {
            failure,
            status: stored.status,
            version: stored.version === payment.version,
            credit: settlement.approvedCredit,
        }
    })
    expect(result).toEqual({
        failure: 'validation',
        status: 'submitted',
        version: true,
        credit: '0.00',
    })
})
