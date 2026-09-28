import { persistentGradingDownstream } from './grading-downstream-resolver'
import { parseGradingRevision } from '@/api/contracts/grading-revision'
import type { GradingDownstream } from '../grading-downstream'
import type { Grading, GradingQuery } from '@/core/types/grading'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { GradingMutation } from './grading-mutation'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess, evaluateRecordAccess } from '@/core/domain/record-policy'
import { parseGradingInput, parseGradingQuery } from '@/api/grading-mapper'
import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import { hashMutationPayload } from './idempotency'
import { writeGrading } from './grading-mutation'
import { gradingAssignment, labelGrading } from './grading-context'
import { gradingAccess, presentGrading, requireGradingPermission } from '../grading-policy'
const readStores: readonly DemoStore[] = [
    'metadata',
    'deliveries',
    'invoices',
    'gradings',
    'assignments',
    'orders',
    'purchase-orders',
    'mitras',
    'graders',
    'timber-products',
]
export class GradingRepository {
    constructor(
        private readonly options: DatabaseOptions = {},
        private readonly downstream?: GradingDownstream,
    ) {}
    async list(
        user: SessionUser | null,
        query: GradingQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Grading>> {
        const actor = requireGradingPermission(user, 'read')
        const filter = parseGradingQuery(query)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const records: Grading[] = []
                for (const grading of await transaction.list('gradings')) {
                    const assignment = await gradingAssignment(transaction, grading.assignmentId)
                    if (
                        evaluateRecordAccess(
                            actor,
                            'gradings.read',
                            gradingAccess(grading, assignment),
                        ) !== 'allowed'
                    )
                        continue
                    records.push(
                        presentGrading(
                            labelGrading(grading, assignment),
                            assignment,
                            actor,
                            metadata.generation,
                        ),
                    )
                }
                const search = filter.search.toLocaleLowerCase('id').trim()
                const matches = records
                    .filter(
                        (grading) =>
                            (!filter.assignmentId ||
                                grading.assignmentId === filter.assignmentId) &&
                            (!filter.status || grading.status === filter.status) &&
                            [
                                grading.purchaseOrderNumber,
                                grading.mitraName,
                                grading.graderName,
                            ].some((label) => label.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort((a, b) => {
                        const comparison =
                            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
                        return filter.sort === 'createdAt' ? comparison : -comparison
                    })
                return {
                    data: matches.slice(
                        (filter.page - 1) * filter.perPage,
                        filter.page * filter.perPage,
                    ),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Grading> {
        const actor = requireGradingPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const grading = await transaction.get('gradings', id)
                if (!grading) throw new ApiError('not-found')
                const assignment = await gradingAssignment(transaction, grading.assignmentId)
                assertRecordAccess(actor, 'gradings.read', gradingAccess(grading, assignment))
                return presentGrading(
                    labelGrading(grading, assignment),
                    assignment,
                    actor,
                    metadata.generation,
                )
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<GradingMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Grading> {
        const actor = requireGradingPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'revise'
                ? parseGradingRevision(mutation.input)
                : mutation.action === 'reject'
                  ? parseWorkflowRejection(mutation.input)
                  : mutation.action === 'submit' || mutation.action === 'approve'
                    ? parseWorkflowVersion(mutation.input)
                    : parseGradingInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...readStores, 'audit', 'gradingMutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const grading = await writeGrading(
                    transaction,
                    metadata,
                    actor,
                    {
                        ...mutation,
                        input,
                        hash,
                    },
                    this.downstream ?? (await persistentGradingDownstream(transaction)),
                )
                return presentGrading(
                    grading,
                    await gradingAssignment(transaction, grading.assignmentId),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
