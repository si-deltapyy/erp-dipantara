import { createClosingScenario } from './closing-scenario'
import {
    ClosingRepository,
    closingStores,
} from '../../resources/js/src/api/mocks/persistence/closing-repository'
import { requestClosing } from '../../resources/js/src/api/mocks/persistence/closing-request'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { requireDataset } from '../../resources/js/src/api/mocks/persistence/demo-repository'
export async function exerciseClosingRequest(): Promise<
    Awaited<ReturnType<typeof runRequestScenario>>
> {
    return runRequestScenario()
}
async function runRequestScenario() {
    const { context, closings, eligible, initial } = await createClosingScenario()
    const { admin, maker, owner, po, generation, signal, options } = context
    const input = {
        purchaseOrderId: po.id,
        version: eligible.version,
        snapshotToken: eligible.snapshotToken,
        notes: 'Ready to close',
    }
    const failures: string[] = []
    for (const [actor, draft] of [
        [maker, input],
        [owner, input],
        [admin, { ...input, snapshotToken: initial.snapshotToken }],
    ] as const) {
        try {
            await closings.create(actor, draft, crypto.randomUUID(), generation, signal)
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
                await requestClosing(
                    tx,
                    await requireDataset(tx),
                    admin,
                    input,
                    'rollback',
                    'rollback-hash',
                )
                throw new Error('Injected persistence failure')
            },
        )
    } catch {
        failures.push('rollback')
    }
    const afterRollback = await closings.list(
        admin,
        { page: 1, perPage: 20, search: '', sort: '-createdAt', purchaseOrderId: po.id },
        signal,
    )
    const race = await Promise.allSettled(
        ['first', 'second'].map((key) => closings.create(admin, input, key, generation, signal)),
    )
    const winnerIndex = race.findIndex((result) => result.status === 'fulfilled')
    const replay = await new ClosingRepository(options).create(
        admin,
        input,
        ['first', 'second'][winnerIndex] ?? '',
        generation,
        signal,
    )
    try {
        await closings.create(
            admin,
            { ...input, notes: 'Changed payload' },
            ['first', 'second'][winnerIndex] ?? '',
            generation,
            signal,
        )
    } catch (cause) {
        failures.push((cause as { kind: string }).kind)
    }
    const records = await closings.list(
        admin,
        { page: 1, perPage: 1, search: '', sort: '-createdAt', purchaseOrderId: po.id },
        signal,
    )
    const snapshot = await runDemoTransaction(
        options,
        ['purchase-orders', 'audit'],
        'readonly',
        async (tx) => ({
            status: (await tx.get('purchase-orders', po.id))?.status,
            auditCount: (await tx.list('audit')).filter(
                (event) => 'resource' in event && event.resource === 'closings',
            ).length,
        }),
    )
    return {
        failures,
        afterRollback: afterRollback.meta.total,
        successCount: race.filter((result) => result.status === 'fulfilled').length,
        conflicts: race
            .filter((result) => result.status === 'rejected')
            .map((result) => (result.reason as { kind: string }).kind),
        replay,
        records,
        snapshot,
        current: await closings.eligibility(admin, po.id, signal),
    }
}
