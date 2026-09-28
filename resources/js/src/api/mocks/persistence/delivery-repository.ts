import { parseWorkflowVersion } from '@/api/contracts/workflow-parsers'
import type {
    AvailabilityQuery,
    AvailableTimber,
    Delivery,
    DeliveryQuery,
} from '@/core/types/delivery'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { DeliveryMutation } from './delivery-mutation'
import {
    parseAvailabilityQuery,
    parseDeliveryInput,
    parseDeliveryQuery,
} from '@/api/delivery-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { presentDelivery, requireDeliveryPermission } from '../delivery-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import { deliveryAvailability } from './delivery-availability'
import { writeDelivery } from './delivery-mutation'
import { hashMutationPayload } from './idempotency'
const stores: readonly DemoStore[] = [
    'metadata',
    'documents',
    'deliveries',
    'gradings',
    'assignments',
    'orders',
    'purchase-orders',
]
export class DeliveryRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: DeliveryQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Delivery>> {
        const actor = requireDeliveryPermission(user, 'read')
        const filter = parseDeliveryQuery(query)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('deliveries'))
                    .filter(
                        (delivery) =>
                            (!filter.purchaseOrderId ||
                                delivery.purchaseOrderId === filter.purchaseOrderId) &&
                            (!filter.assignmentId ||
                                delivery.allocationContext.some(
                                    (row) => row.assignmentId === filter.assignmentId,
                                )) &&
                            (!filter.status || delivery.status === filter.status) &&
                            [
                                delivery.purchaseOrderNumber,
                                delivery.buyerName,
                                delivery.licensePlate,
                            ].some((label) => label.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort((a, b) => {
                        const comparison =
                            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
                        return filter.sort === 'createdAt' ? comparison : -comparison
                    })
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((delivery) => presentDelivery(delivery, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Delivery> {
        const actor = requireDeliveryPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const delivery = await transaction.get('deliveries', id)
                if (!delivery) throw new ApiError('not-found')
                return presentDelivery(delivery, actor, metadata.generation)
            },
            signal,
        )
    }
    async availability(
        user: SessionUser | null,
        query: AvailabilityQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<AvailableTimber>> {
        const actor = requireDeliveryPermission(user, 'read')
        if (
            !actor.permissions.includes('deliveries.create.all') &&
            !actor.permissions.includes('deliveries.update.all')
        )
            throw new ApiError('forbidden')
        const filter = parseAvailabilityQuery(query)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const po = await transaction.get('purchase-orders', filter.purchaseOrderId)
                if (!po) throw new ApiError('not-found')
                assertRecordAccess(actor, 'purchase-orders.read', po)
                if (filter.excludeDeliveryId) {
                    const excluded = await transaction.get('deliveries', filter.excludeDeliveryId)
                    if (!excluded || excluded.purchaseOrderId !== po.id)
                        throw new ApiError('not-found')
                    if (
                        excluded.status !== 'draft' ||
                        !actor.permissions.includes('deliveries.update.all')
                    )
                        throw new ApiError('forbidden')
                }
                const rows = (
                    await deliveryAvailability(transaction, po.id, filter.excludeDeliveryId)
                )
                    .filter(
                        (row) =>
                            (!filter.assignmentId || row.assignmentId === filter.assignmentId) &&
                            [row.mitraName, row.timberProductName].some((label) =>
                                label
                                    .toLocaleLowerCase('id')
                                    .includes(filter.search.trim().toLocaleLowerCase('id')),
                            ),
                    )
                    .sort(
                        (a, b) =>
                            a.gradingId.localeCompare(b.gradingId) ||
                            a.rowId.localeCompare(b.rowId),
                    )
                return {
                    data: rows.slice(
                        (filter.page - 1) * filter.perPage,
                        filter.page * filter.perPage,
                    ),
                    meta: { page: filter.page, perPage: filter.perPage, total: rows.length },
                }
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<DeliveryMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Delivery> {
        const actor = requireDeliveryPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'dispatch' || mutation.action === 'receive'
                ? parseWorkflowVersion(mutation.input)
                : parseDeliveryInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...stores, 'audit', 'deliveryMutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentDelivery(
                    await writeDelivery(transaction, metadata, actor, { ...mutation, input, hash }),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
