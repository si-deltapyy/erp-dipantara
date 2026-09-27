import { expect, test } from '@playwright/test'
import type * as GradingModule from '../../../resources/js/src/api/mocks/persistence/grading-repository'
import type * as OrderModule from '../../../resources/js/src/api/mocks/persistence/order-repository'
import type * as AssignmentModule from '../../../resources/js/src/api/mocks/persistence/assignment-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Grading persistence mock')
test('guards grading scope, order approval, capacity, stale versions and idempotent writes', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { GradingRepository } = (await import(
            base + 'api/mocks/persistence/grading-repository.ts'
        )) as typeof GradingModule
        const { OrderRepository } = (await import(
            base + 'api/mocks/persistence/order-repository.ts'
        )) as typeof OrderModule
        const { AssignmentRepository } = (await import(
            base + 'api/mocks/persistence/assignment-repository.ts'
        )) as typeof AssignmentModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const options = { name: 'grading-test-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const signal = new AbortController().signal,
            generation = metadata.generation
        const actor = (id: string) => {
            const found = sessionFixtures.find((user) => user.id === id)
            if (!found) throw new Error(id)
            return found
        }
        const maker = actor('maker-demo'),
            grader = actor('grader-one'),
            other = actor('grader-two'),
            supervisor = actor('supervisor-demo')
        const orders = new OrderRepository(options),
            assignments = new AssignmentRepository(options),
            gradings = new GradingRepository(options)
        const order = await orders.mutate(
            maker,
            {
                action: 'create',
                input: { purchaseOrderId: 'demo-po-03', notes: null },
                key: 'order',
            },
            generation,
            signal,
        )
        const assignment = await assignments.mutate(
            maker,
            {
                action: 'create',
                input: {
                    orderId: order.id,
                    mitraId: 'demo-mitra-01',
                    graderId: 'demo-grader-01',
                    timberProductId: 'demo-timber-01',
                    quantity: 2,
                },
                key: 'assignment',
            },
            generation,
            signal,
        )
        const input = {
            assignmentId: assignment.id,
            gradingDate: '2026-09-27',
            rows: [
                {
                    rowId: 'stable-row',
                    timberProductId: 'demo-timber-01',
                    quantity: 2,
                    diameterCm: '25',
                    lengthM: '2',
                    gradeCode: 'DEMO',
                },
            ],
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
        const draft = await gradings.mutate(
            grader,
            { action: 'create', input, key: 'draft' },
            generation,
            signal,
        )
        const retry = await gradings.mutate(
            grader,
            { action: 'create', input, key: 'draft' },
            generation,
            signal,
        )
        await fail(() => gradings.get(other, draft.id, signal))
        await fail(() =>
            gradings.mutate(
                grader,
                { action: 'submit', id: draft.id, input: { version: draft.version }, key: 'early' },
                generation,
                signal,
            ),
        )
        await fail(() =>
            gradings.mutate(
                grader,
                { action: 'create', input, key: 'over-capacity' },
                generation,
                signal,
            ),
        )
        await fail(() =>
            gradings.mutate(
                grader,
                { action: 'update', id: draft.id, input: { ...input, version: 99 }, key: 'stale' },
                generation,
                signal,
            ),
        )
        await fail(() =>
            gradings.mutate(
                grader,
                { action: 'create', input: { ...input, gradingDate: '2026-09-28' }, key: 'draft' },
                generation,
                signal,
            ),
        )
        const ready = await orders.get(maker, order.id, signal)
        const submitted = await orders.mutate(
            maker,
            {
                action: 'submit',
                id: ready.id,
                input: { version: ready.version },
                key: 'submit-order',
            },
            generation,
            signal,
        )
        await orders.mutate(
            supervisor,
            {
                action: 'approve',
                id: ready.id,
                input: { version: submitted.version },
                key: 'approve-order',
            },
            generation,
            signal,
        )
        const grading = await gradings.mutate(
            grader,
            {
                action: 'submit',
                id: draft.id,
                input: { version: draft.version },
                key: 'submit-grading',
            },
            generation,
            signal,
        )
        const reloaded = await new GradingRepository(options).get(grader, grading.id, signal)
        const reviewFailures: string[] = []
        const rejectReview = async (run: () => Promise<unknown>) => {
            try {
                await run()
                reviewFailures.push('unexpected-success')
            } catch (cause) {
                reviewFailures.push((cause as { kind: string }).kind)
            }
        }
        await rejectReview(() =>
            gradings.mutate(
                { ...grader, permissions: actor('admin-demo').permissions },
                {
                    action: 'approve',
                    id: grading.id,
                    input: { version: grading.version },
                    key: 'self-review',
                },
                generation,
                signal,
            ),
        )
        await rejectReview(() =>
            gradings.mutate(
                supervisor,
                { action: 'approve', id: grading.id, input: { version: 99 }, key: 'stale-review' },
                generation,
                signal,
            ),
        )
        const rejected = await gradings.mutate(
            supervisor,
            {
                action: 'reject',
                id: grading.id,
                input: { version: grading.version, reason: 'Measure again' },
                key: 'reject',
            },
            generation,
            signal,
        )
        const edited = await gradings.mutate(
            grader,
            {
                action: 'update',
                id: grading.id,
                input: { ...input, version: rejected.version },
                key: 'edit',
            },
            generation,
            signal,
        )
        const resubmitted = await gradings.mutate(
            grader,
            {
                action: 'submit',
                id: grading.id,
                input: { version: edited.version },
                key: 'resubmit',
            },
            generation,
            signal,
        )
        const approved = await gradings.mutate(
            supervisor,
            {
                action: 'approve',
                id: grading.id,
                input: { version: resubmitted.version },
                key: 'approve',
            },
            generation,
            signal,
        )
        const approvedRetry = await gradings.mutate(
            supervisor,
            {
                action: 'approve',
                id: grading.id,
                input: { version: resubmitted.version },
                key: 'approve',
            },
            generation,
            signal,
        )
        const empty = await gradings.list(
            other,
            { page: 1, perPage: 20, search: '', sort: '-createdAt' },
            signal,
        )
        return {
            reviewFailures,
            reason: edited.rejectionReason,
            cleared: resubmitted.rejectionReason,
            approvedStatus: approved.status,
            sameVersion: approved.version === approvedRetry.version,
            failures,
            sameId: retry.id === draft.id,
            status: reloaded.status,
            rowId: reloaded.rows[0]?.rowId,
            total: reloaded.totalVolumeM3,
            otherTotal: empty.meta.total,
            serialized: JSON.stringify(reloaded),
        }
    })
    expect(result.failures).toEqual(['not-found', 'conflict', 'validation', 'conflict', 'conflict'])
    expect(result.reviewFailures).toEqual(['forbidden', 'conflict'])
    expect(result.reason).toBe('Measure again')
    expect(result.cleared).toBeNull()
    expect(result.approvedStatus).toBe('approved')
    expect(result.sameVersion).toBe(true)
    expect(result.sameId).toBe(true)
    expect(result.status).toBe('submitted')
    expect(result.rowId).toBe('stable-row')
    expect(result.total).toBe('0.196350')
    expect(result.otherTotal).toBe(0)
    expect(result.serialized).not.toMatch(/price|amount|bank|phone/i)
})
