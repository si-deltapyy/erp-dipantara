import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../grading-scenario'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as MutationModule from '../../../resources/js/src/api/mocks/persistence/grading-mutation'
import type * as SchemaModule from '../../../resources/js/src/api/mocks/persistence/schema'
import type * as DownstreamModule from '../../../resources/js/src/api/mocks/grading-downstream'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading revision rollback mock')
test('preserves the approved source through revision rejection and rolls back every approval side effect', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createApprovedGradingScenario } = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof ScenarioModule
        const { runDemoTransaction } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const { writeGrading } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/grading-mutation.ts'
        )) as typeof MutationModule
        const { demoStores } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/schema.ts'
        )) as typeof SchemaModule
        const { gradingDownstreamFixtures } = (await import(
            origin + '/resources/js/src/api/mocks/grading-downstream.ts'
        )) as typeof DownstreamModule
        const { options, gradings, grader, supervisor, approved, generation, signal } =
            await createApprovedGradingScenario()
        const revision = await gradings.mutate(
            grader,
            {
                action: 'revise',
                id: approved.id,
                input: {
                    version: approved.version,
                    reason: 'Measure diameter again',
                    gradingDate: approved.gradingDate,
                    rows: approved.rows.map((row) => ({ ...row, diameterCm: '20.00' })),
                },
                key: 'revision',
            },
            generation,
            signal,
        )
        const submitted = await gradings.mutate(
            grader,
            {
                action: 'submit',
                id: revision.id,
                input: { version: revision.version },
                key: 'submit-revision',
            },
            generation,
            signal,
        )
        const rejected = await gradings.mutate(
            supervisor,
            {
                action: 'reject',
                id: revision.id,
                input: { version: submitted.version, reason: 'Check date' },
                key: 'reject-revision',
            },
            generation,
            signal,
        )
        const sourceAfterRejection = await gradings.get(grader, approved.id, signal)
        const updated = await gradings.mutate(
            grader,
            {
                action: 'update',
                id: revision.id,
                input: {
                    assignmentId: revision.assignmentId,
                    gradingDate: '2026-09-28',
                    rows: revision.rows,
                    version: rejected.version,
                },
                key: 'edit-revision',
            },
            generation,
            signal,
        )
        const resubmitted = await gradings.mutate(
            grader,
            {
                action: 'submit',
                id: revision.id,
                input: { version: updated.version },
                key: 'resubmit-revision',
            },
            generation,
            signal,
        )
        const snapshot = () =>
            runDemoTransaction(options, demoStores, 'readonly', async (transaction) => ({
                parent: await transaction.get('gradings', approved.id),
                revision: await transaction.get('gradings', revision.id),
                metadata: await transaction.get('metadata', 'dataset'),
                receipts: await transaction.count('gradingMutations'),
                audit: await transaction.count('audit'),
            }))
        const before = await snapshot()
        const failed = await runDemoTransaction(
            options,
            demoStores,
            'readwrite',
            async (transaction) => {
                const metadata = await transaction.get('metadata', 'dataset')
                if (!metadata) throw new Error('Missing metadata')
                await writeGrading(
                    transaction,
                    metadata,
                    supervisor,
                    {
                        action: 'approve',
                        id: revision.id,
                        input: { version: resubmitted.version },
                        key: 'rollback-approval',
                        hash: 'synthetic',
                    },
                    gradingDownstreamFixtures,
                )
                throw new DOMException('Synthetic persistence failure', 'QuotaExceededError')
            },
        ).then(
            () => false,
            () => true,
        )
        const after = await snapshot()
        return {
            failed,
            unchanged: JSON.stringify(before) === JSON.stringify(after),
            parentStatus: sourceAfterRejection.status,
            reason: updated.revisionReason,
            rejection: updated.rejectionReason,
            cleared: resubmitted.rejectionReason,
            rowId: updated.rows[0]?.rowId,
        }
    })
    expect(result.failed).toBe(true)
    expect(result.unchanged).toBe(true)
    expect(result.parentStatus).toBe('approved')
    expect(result.reason).toBe('Measure diameter again')
    expect(result.rejection).toBe('Check date')
    expect(result.cleared).toBeNull()
    expect(result.rowId).toBe('stable-row')
})
