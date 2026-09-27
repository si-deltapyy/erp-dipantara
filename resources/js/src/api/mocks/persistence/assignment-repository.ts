import type { Assignment, AssignmentQuery } from '@/core/types/assignment'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess, evaluateRecordAccess } from '@/core/domain/record-policy'
import { parseAssignmentInput, parseAssignmentQuery } from '@/api/assignment-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { presentAssignment, requireAssignmentPermission } from '../assignment-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeAssignment } from './assignment-mutation'
import type { AssignmentMutation } from './assignment-mutation'
import { resolveAssignmentLabels } from './assignment-labels'
import type { DemoStore } from './schema'

const readStores: readonly DemoStore[] = [
    'metadata',
    'orders',
    'purchase-orders',
    'assignments',
    'mitras',
    'graders',
    'timber-products',
]
export class AssignmentRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: AssignmentQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Assignment>> {
        const actor = requireAssignmentPermission(user, 'read')
        const filter = parseAssignmentQuery(query)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const scoped = (await transaction.list('assignments')).filter(
                    (assignment) =>
                        evaluateRecordAccess(actor, 'assignments.read', assignment) === 'allowed',
                )
                const labeled = await Promise.all(
                    scoped.map((assignment) => resolveAssignmentLabels(transaction, assignment)),
                )
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = labeled
                    .filter(
                        (assignment) =>
                            (!filter.orderId || assignment.orderId === filter.orderId) &&
                            (!filter.mitraId || assignment.mitraId === filter.mitraId) &&
                            (!filter.graderId || assignment.graderId === filter.graderId) &&
                            [
                                assignment.purchaseOrderNumber,
                                assignment.mitraName,
                                assignment.graderName,
                                assignment.timberProductName,
                            ].some((value) => value.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort((a, b) => {
                        const assignment =
                            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
                        return filter.sort === 'createdAt' ? assignment : -assignment
                    })
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((assignment) =>
                            presentAssignment(assignment, actor, metadata.generation),
                        ),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Assignment> {
        const actor = requireAssignmentPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const assignment = await transaction.get('assignments', id)
                if (!assignment) throw new ApiError('not-found')
                assertRecordAccess(actor, 'assignments.read', assignment)
                return presentAssignment(
                    await resolveAssignmentLabels(transaction, assignment),
                    actor,
                    metadata.generation,
                )
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<AssignmentMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Assignment> {
        const actor = requireAssignmentPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input = parseAssignmentInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...readStores, 'audit', 'assignmentMutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const assignment = await writeAssignment(transaction, metadata, actor, {
                    ...mutation,
                    input,
                    hash,
                })
                return presentAssignment(assignment, actor, generation)
            },
            signal,
        )
    }
}
