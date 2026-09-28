import type { ClosingReviewMutation } from './closing-review'
import { reviewClosing } from './closing-review'
import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import type { Closing, ClosingInput, ClosingQuery, ClosingEligibility } from '@/core/types/closing'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { parseClosingInput, parseClosingQuery } from '@/api/contracts/closing-input'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import { closingEligibility } from './closing-evaluator'
import { requireClosingPermission, presentClosing } from './closing-policy'
import { requestClosing } from './closing-request'
import { hashMutationPayload } from './idempotency'
export const closingStores: readonly DemoStore[] = [
    'metadata',
    'closings',
    'purchase-orders',
    'orders',
    'assignments',
    'gradings',
    'deliveries',
    'invoices',
    'invoiceVersions',
    'payments',
]
export class ClosingRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async eligibility(
        user: SessionUser | null,
        id: string,
        signal: AbortSignal,
    ): Promise<ClosingEligibility> {
        const actor = requireClosingPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            closingStores,
            'readonly',
            (transaction) => closingEligibility(transaction, actor, id),
            signal,
        )
    }
    async list(
        user: SessionUser | null,
        query: ClosingQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Closing>> {
        const actor = requireClosingPermission(user, 'read')
        const filter = parseClosingQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'closings'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const matches = (await transaction.list('closings'))
                    .filter(
                        (closing) =>
                            (!filter.purchaseOrderId ||
                                closing.purchaseOrderId === filter.purchaseOrderId) &&
                            (!filter.status || closing.status === filter.status) &&
                            closing.purchaseOrderNumber
                                .toLocaleLowerCase('id')
                                .includes(filter.search.trim().toLocaleLowerCase('id')),
                    )
                    .sort(
                        (a, b) =>
                            (filter.sort === 'createdAt' ? 1 : -1) *
                            (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
                    )
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((closing) => presentClosing(closing, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Closing> {
        const actor = requireClosingPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'closings'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const closing = await transaction.get('closings', id)
                if (!closing) throw new ApiError('not-found')
                return presentClosing(closing, actor, metadata.generation)
            },
            signal,
        )
    }
    async create(
        user: SessionUser | null,
        input: ClosingInput,
        key: string,
        generation: string,
        signal: AbortSignal,
    ): Promise<Closing> {
        const actor = requireClosingPermission(user, 'request')
        const payload = parseClosingInput(input)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const hash = await hashMutationPayload({ ...payload, generation })
        return runDemoTransaction(
            this.options,
            [...closingStores, 'closingMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentClosing(
                    await requestClosing(transaction, metadata, actor, payload, key, hash),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
    async review(
        user: SessionUser | null,
        mutation: Omit<ClosingReviewMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Closing> {
        const actor = requireClosingPermission(user, mutation.action)
        parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'reject'
                ? parseWorkflowRejection(mutation.input)
                : parseWorkflowVersion(mutation.input)
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...closingStores, 'closingMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentClosing(
                    await reviewClosing(transaction, metadata, actor, { ...mutation, input, hash }),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
