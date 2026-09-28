import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../grading-scenario'
import type * as GradingModule from '../../../resources/js/src/api/mocks/persistence/grading-repository'
import type * as DownstreamModule from '../../../resources/js/src/api/mocks/grading-downstream'
import type * as InvoiceModule from '../../../resources/js/src/api/mocks/invoice-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading revision persistence mock')
test('atomically replaces approved grading and guards used rows, capacity and invoice immutability', async ({
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
        const { GradingRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/grading-repository.ts'
        )) as typeof GradingModule
        const { gradingDownstreamFixtures } = (await import(
            origin + '/resources/js/src/api/mocks/grading-downstream.ts'
        )) as typeof DownstreamModule
        const { invoiceFixtures } = (await import(
            origin + '/resources/js/src/api/mocks/invoice-fixtures.ts'
        )) as typeof InvoiceModule
        const scenario = await createApprovedGradingScenario()
        const { options, grader, supervisor, generation, signal, approved, input } = scenario
        const invoiceBefore = JSON.stringify(invoiceFixtures)
        let locks: readonly DownstreamModule.GradingAllocationFixture[] = [
            { gradingId: approved.id, rowId: 'stable-row', status: 'dispatched' },
        ]
        const repository = new GradingRepository(options, {
            ...gradingDownstreamFixtures,
            allocations: () => locks,
        })
        const revisionInput = {
            version: approved.version,
            reason: 'Correct diameter 25 to 20',
            gradingDate: approved.gradingDate,
            rows: approved.rows.map((row) => ({ ...row, diameterCm: '20.00' })),
        }
        const failures: string[] = []
        const fail = async (run: () => Promise<unknown>) => {
            try {
                await run()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await fail(() =>
            repository.mutate(
                grader,
                { action: 'revise', id: approved.id, input: revisionInput, key: 'locked' },
                generation,
                signal,
            ),
        )
        locks = []
        await fail(() =>
            repository.mutate(
                grader,
                {
                    action: 'revise',
                    id: approved.id,
                    input: { ...revisionInput, version: 99 },
                    key: 'stale',
                },
                generation,
                signal,
            ),
        )
        const revision = await repository.mutate(
            grader,
            { action: 'revise', id: approved.id, input: revisionInput, key: 'revision' },
            generation,
            signal,
        )
        const retry = await repository.mutate(
            grader,
            { action: 'revise', id: approved.id, input: revisionInput, key: 'revision' },
            generation,
            signal,
        )
        await fail(() =>
            repository.mutate(
                grader,
                { action: 'revise', id: approved.id, input: revisionInput, key: 'second-revision' },
                generation,
                signal,
            ),
        )
        await fail(() =>
            repository.mutate(
                grader,
                { action: 'create', input, key: 'extra-capacity' },
                generation,
                signal,
            ),
        )
        const oldBefore = await repository.get(grader, approved.id, signal)
        const submitted = await repository.mutate(
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
        locks = [{ gradingId: approved.id, rowId: 'stable-row', status: 'reserved' }]
        await fail(() =>
            repository.mutate(
                supervisor,
                {
                    action: 'approve',
                    id: revision.id,
                    input: { version: submitted.version },
                    key: 'locked-approval',
                },
                generation,
                signal,
            ),
        )
        const oldAfterFailure = await repository.get(grader, approved.id, signal)
        locks = []
        const active = await repository.mutate(
            supervisor,
            {
                action: 'approve',
                id: revision.id,
                input: { version: submitted.version },
                key: 'approve-revision',
            },
            generation,
            signal,
        )
        const replay = await repository.mutate(
            supervisor,
            {
                action: 'approve',
                id: revision.id,
                input: { version: submitted.version },
                key: 'approve-revision',
            },
            generation,
            signal,
        )
        const oldAfter = await repository.get(grader, approved.id, signal)
        const effective = await repository.list(
            grader,
            { page: 1, perPage: 20, search: '', sort: '-createdAt', status: 'approved' },
            signal,
        )
        await fail(() =>
            repository.mutate(
                grader,
                { action: 'create', input, key: 'post-revision-capacity' },
                generation,
                signal,
            ),
        )
        locks = [{ gradingId: approved.id, rowId: 'stable-row', status: 'received' }]
        await fail(() =>
            repository.mutate(
                grader,
                {
                    action: 'revise',
                    id: active.id,
                    input: {
                        ...revisionInput,
                        version: active.version,
                        rows: active.rows.map((row) => ({ ...row, quantity: 1 })),
                    },
                    key: 'ancestor-lock',
                },
                generation,
                signal,
            ),
        )
        return {
            failures,
            sameRevision: revision.id === retry.id,
            oldBefore: oldBefore.status,
            oldAfterFailure: oldAfterFailure.status,
            oldAfter: oldAfter.status,
            originalVolume: oldAfter.totalVolumeM3,
            newVolume: active.totalVolumeM3,
            rowId: active.rows[0]?.rowId,
            flag: active.invoiceRevisionRequired,
            reason: active.revisionReason,
            effectiveIds: effective.data.map((grading) => grading.id),
            activeId: active.id,
            sameApprovalVersion: replay.version === active.version,
            invoicesUnchanged: invoiceBefore === JSON.stringify(invoiceFixtures),
        }
    })
    expect(result.failures).toEqual([
        'conflict',
        'conflict',
        'conflict',
        'validation',
        'conflict',
        'validation',
        'conflict',
    ])
    expect(result.sameRevision).toBe(true)
    expect(result.oldBefore).toBe('approved')
    expect(result.oldAfterFailure).toBe('approved')
    expect(result.oldAfter).toBe('superseded')
    expect(result.originalVolume).toBe('0.196350')
    expect(result.newVolume).toBe('0.125664')
    expect(result.rowId).toBe('stable-row')
    expect(result.flag).toBe(true)
    expect(result.reason).toBe('Correct diameter 25 to 20')
    expect(result.effectiveIds).toEqual([result.activeId])
    expect(result.sameApprovalVersion).toBe(true)
    expect(result.invoicesUnchanged).toBe(true)
})
