import { createClosingScenario } from './closing-scenario'
import { issueSettlementInvoice, submitSettlementPayment } from './settlement-scenario'
import { closingStores } from '../../resources/js/src/api/mocks/persistence/closing-repository'
import { reviewClosing } from '../../resources/js/src/api/mocks/persistence/closing-review'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { requireDataset } from '../../resources/js/src/api/mocks/persistence/demo-repository'
export async function createRequestedClosing(
    separateCreator = false,
): Promise<Awaited<ReturnType<typeof requestScenario>>> {
    return requestScenario(separateCreator)
}
async function requestScenario(separateCreator: boolean) {
    const scenario = await createClosingScenario()
    const { context, closings, eligible } = scenario
    const actor = separateCreator ? { ...context.admin, id: 'requesting-admin' } : context.admin
    const closing = await closings.create(
        actor,
        {
            purchaseOrderId: context.po.id,
            version: eligible.version,
            snapshotToken: eligible.snapshotToken,
            notes: 'Review closing',
        },
        'request',
        context.generation,
        context.signal,
    )
    return { ...scenario, closing }
}
export async function exerciseClosingReview(): Promise<Awaited<ReturnType<typeof reviewScenario>>> {
    return reviewScenario()
}
async function reviewScenario() {
    const { context, closings, closing } = await createRequestedClosing()
    const { admin, supervisor, generation, signal, options, po } = context
    const mutation = {
        id: closing.id,
        action: 'approve' as const,
        input: { version: closing.version },
        key: 'approve',
    }
    const failures: string[] = []
    for (const [actor, change] of [
        [admin, mutation],
        [supervisor, { ...mutation, input: { version: 99 } }],
        [
            supervisor,
            {
                ...mutation,
                action: 'reject' as const,
                input: { version: closing.version, reason: '' },
            },
        ],
    ] as const) {
        try {
            await closings.review(actor, change, generation, signal)
        } catch (cause) {
            failures.push((cause as { kind: string }).kind)
        }
    }
    try {
        await runDemoTransaction(
            options,
            [...closingStores, 'closingMutations', 'audit'],
            'readwrite',
            async (tx) => {
                await reviewClosing(tx, await requireDataset(tx), supervisor, {
                    ...mutation,
                    key: 'rollback',
                    hash: 'rollback-hash',
                })
                throw new Error('Injected audit failure')
            },
        )
    } catch {
        failures.push('rollback')
    }
    const rollback = await runDemoTransaction(
        options,
        ['closings', 'purchase-orders'],
        'readonly',
        async (tx) => ({
            closing: (await tx.get('closings', closing.id))?.status,
            po: (await tx.get('purchase-orders', po.id))?.status,
        }),
    )
    const lateInvoice = await issueSettlementInvoice(context, 'payable', 'settlement', '100.00')
    try {
        await closings.review(supervisor, mutation, generation, signal)
    } catch (cause) {
        failures.push((cause as { kind: string }).kind)
    }
    const rejected = await closings.review(
        supervisor,
        {
            ...mutation,
            action: 'reject',
            input: { version: closing.version, reason: 'Settle the new invoice' },
            key: 'reject',
        },
        generation,
        signal,
    )
    const latePayment = await submitSettlementPayment(context, lateInvoice, '100.00')
    await context.payments.mutate(
        supervisor,
        {
            action: 'approve',
            id: latePayment.id,
            input: { version: latePayment.version },
            key: 'late-payment',
        },
        generation,
        signal,
    )
    const eligibility = await closings.eligibility(admin, po.id, signal)
    const next = await closings.create(
        admin,
        {
            purchaseOrderId: po.id,
            version: eligibility.version,
            snapshotToken: eligibility.snapshotToken,
            notes: 'Corrected',
        },
        'second-request',
        generation,
        signal,
    )
    const race = await Promise.allSettled(
        ['first', 'second'].map((key) =>
            closings.review(
                supervisor,
                { id: next.id, action: 'approve', input: { version: next.version }, key },
                generation,
                signal,
            ),
        ),
    )
    const winner = race.findIndex((result) => result.status === 'fulfilled')
    const replay = await closings.review(
        supervisor,
        {
            id: next.id,
            action: 'approve',
            input: { version: next.version },
            key: ['first', 'second'][winner] ?? '',
        },
        generation,
        signal,
    )
    const final = await runDemoTransaction(
        options,
        ['closings', 'purchase-orders', 'audit'],
        'readonly',
        async (tx) => ({
            po: (await tx.get('purchase-orders', po.id))?.status,
            old: (await tx.get('closings', rejected.id))?.rejectionReason,
            closeAudits: (await tx.list('audit')).filter(
                (event) => 'action' in event && event.action === 'close',
            ).length,
        }),
    )
    return {
        failures,
        rollback,
        rejected,
        next,
        replay,
        final,
        successes: race.filter((result) => result.status === 'fulfilled').length,
        conflicts: race
            .filter((result) => result.status === 'rejected')
            .map((result) => (result.reason as { kind: string }).kind),
        history: await closings.list(
            supervisor,
            { page: 1, perPage: 20, search: '', sort: '-createdAt', purchaseOrderId: po.id },
            signal,
        ),
    }
}
