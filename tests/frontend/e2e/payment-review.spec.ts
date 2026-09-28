import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import { login, expectNoOverflow } from './session-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment review mock')
test('rejects self review and serializes competing approvals without overpayment or duplicate settlement', async ({
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
        const { owner, admin, supervisor, payments, invoices, invoice, generation, signal, input } =
            context
        const failures: string[] = []
        async function fail(run: () => Promise<unknown>): Promise<void> {
            try {
                await run()
                failures.push('unexpected')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        const self = await createSubmittedPayment(context, admin, '1.00')
        await fail(() =>
            payments.mutate(
                admin,
                { action: 'approve', id: self.id, input: { version: self.version }, key: 'self' },
                generation,
                signal,
            ),
        )
        const first = await createSubmittedPayment(context, owner, '1000000.00')
        const second = await createSubmittedPayment(context, owner, '1000000.00')
        const race = await Promise.allSettled(
            [first, second].map((payment) =>
                payments.mutate(
                    supervisor,
                    {
                        action: 'approve',
                        id: payment.id,
                        input: { version: payment.version },
                        key: 'race',
                    },
                    generation,
                    signal,
                ),
            ),
        )
        const winnerIndex = race.findIndex((outcome) => outcome.status === 'fulfilled')
        const winner = [first, second][winnerIndex]
        const loser = [first, second][1 - winnerIndex]
        if (!winner || !loser) throw new Error('Missing race outcome')
        await payments.mutate(
            supervisor,
            { action: 'approve', id: winner.id, input: { version: winner.version }, key: 'race' },
            generation,
            signal,
        )
        const before = await invoices.settlement(owner, invoice.id, signal)
        await fail(() =>
            invoices.mutate(
                context.maker,
                {
                    action: 'revise',
                    id: invoice.id,
                    input: {
                        version: invoice.version,
                        reason: 'Too low',
                        terms: [{ label: 'Invalid', amount: '999999.99', dueDate: null }],
                    },
                    key: 'below-credit',
                },
                generation,
                signal,
            ),
        )
        await fail(() =>
            payments.mutate(
                supervisor,
                {
                    action: 'reject',
                    id: loser.id,
                    input: { version: loser.version, reason: '' },
                    key: 'blank',
                },
                generation,
                signal,
            ),
        )
        const rejected = await payments.mutate(
            supervisor,
            {
                action: 'reject',
                id: loser.id,
                input: { version: loser.version, reason: 'Correct amount' },
                key: 'reject',
            },
            generation,
            signal,
        )
        const updated = await payments.mutate(
            owner,
            {
                action: 'update',
                id: loser.id,
                input: {
                    ...input,
                    cashAmount: '700000.00',
                    withholdingAmount: '0.00',
                    proofDocumentId: loser.proofDocumentId,
                    version: rejected.version,
                },
                key: 'edit',
            },
            generation,
            signal,
        )
        const submitted = await payments.mutate(
            owner,
            { action: 'submit', id: loser.id, input: { version: updated.version }, key: 'again' },
            generation,
            signal,
        )
        await payments.mutate(
            supervisor,
            {
                action: 'approve',
                id: loser.id,
                input: { version: submitted.version },
                key: 'finish',
            },
            generation,
            signal,
        )
        const final = await invoices.settlement(owner, invoice.id, signal)
        const events = await runDemoTransaction(
            context.options,
            ['audit'],
            'readonly',
            async (tx) =>
                (await tx.list('audit')).filter(
                    (event) => 'resource' in event && event.resource === 'payments',
                ),
        )
        const audits = events.filter(
            (event) => 'action' in event && event.action === 'approve',
        ).length
        const auditReason = events.some(
            (event) => 'reason' in event && event.reason === 'Correct amount',
        )
        return {
            auditReason,
            successes: race.filter((outcome) => outcome.status === 'fulfilled').length,
            raceFailure: race
                .filter((outcome) => outcome.status === 'rejected')
                .map((outcome) => (outcome.reason as { kind: string }).kind),
            before,
            final,
            reason: rejected.rejectionReason,
            audits,
            failures,
        }
    })
    expect(result).toMatchObject({
        auditReason: true,
        successes: 1,
        raceFailure: ['conflict'],
        before: { approvedCredit: '1000000.00', outstandingAmount: '700000.00' },
        final: { approvedCredit: '1700000.00', outstandingAmount: '0.00', overdueAmount: '0.00' },
        reason: 'Correct amount',
        audits: 2,
        failures: ['forbidden', 'conflict', 'validation'],
    })
})
test('reviewer rejects with required reason and approves a separate payment through the UI', async ({
    page,
}) => {
    await page.goto('/app')
    const ids = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario, createSubmittedPayment } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        const context = await createPaymentScenario('woodflow-demo')
        return [
            (await createSubmittedPayment(context, context.owner, '1000000.00')).id,
            (await createSubmittedPayment(context, context.owner, '700000.00')).id,
        ]
    })
    await login(page, 'supervisor@woodflow.test', '/app/payments/' + ids[0])
    await expect(page.getByRole('link', { name: 'Edit pembayaran', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Tolak pembayaran', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(page.getByLabel('Alasan penolakan', { exact: true })).toBeFocused()
    await dialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(
        page.getByText('Isi alasan penolakan dengan 1 sampai 2.000 karakter.', { exact: true }),
    ).toBeVisible()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Bukti perlu diperbaiki')
    await dialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Bukti perlu diperbaiki', { exact: true })).toBeVisible()
    await page.goto('/app/payments/' + ids[1])
    await page.getByRole('button', { name: 'Setujui pembayaran', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui pembayaran', exact: true })).toHaveCount(
        0,
    )
    await expectNoOverflow(page)
})
