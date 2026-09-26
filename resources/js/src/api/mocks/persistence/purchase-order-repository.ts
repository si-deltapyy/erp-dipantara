import type { PurchaseOrder, PurchaseOrderQuery } from '@/core/types/purchase-order'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess, evaluateRecordAccess } from '@/core/domain/record-policy'
import {
    parsePurchaseOrderInput,
    parsePurchaseOrderUpdate,
    parsePurchaseOrderQuery,
    parsePurchaseOrderVersion,
} from '@/api/purchase-order-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { presentPurchaseOrder, requirePurchaseOrderPermission } from '../purchase-order-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writePurchaseOrder } from './purchase-order-mutation'
import type { PurchaseOrderMutation } from './purchase-order-mutation'
import { resolvePurchaseOrderLabels } from './purchase-order-labels'
import type { DemoStore } from './schema'

const readStores: readonly DemoStore[] = [
    'metadata',
    'purchase-orders',
    'buyers',
    'timber-products',
]
export class PurchaseOrderRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: PurchaseOrderQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<PurchaseOrder>> {
        const actor = requirePurchaseOrderPermission(user, 'read')
        const filter = parsePurchaseOrderQuery(query)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const scoped = (await transaction.list('purchase-orders')).filter(
                    (order) =>
                        evaluateRecordAccess(actor, 'purchase-orders.read', order) === 'allowed',
                )
                const labeled = await Promise.all(
                    scoped.map((order) => resolvePurchaseOrderLabels(transaction, order)),
                )
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = labeled
                    .filter(
                        (order) =>
                            (!filter.buyerId || order.buyerId === filter.buyerId) &&
                            (!filter.status || order.status === filter.status) &&
                            [order.number, order.buyerName].some((value) =>
                                value.toLocaleLowerCase('id').includes(search),
                            ),
                    )
                    .sort((a, b) => {
                        const order =
                            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
                        return filter.sort === 'createdAt' ? order : -order
                    })
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((order) => presentPurchaseOrder(order, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<PurchaseOrder> {
        const actor = requirePurchaseOrderPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const order = await transaction.get('purchase-orders', id)
                if (!order) throw new ApiError('not-found')
                assertRecordAccess(actor, 'purchase-orders.read', order)
                return presentPurchaseOrder(
                    await resolvePurchaseOrderLabels(transaction, order),
                    actor,
                    metadata.generation,
                )
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<PurchaseOrderMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<PurchaseOrder> {
        const actor = requirePurchaseOrderPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'create'
                ? parsePurchaseOrderInput(mutation.input)
                : mutation.action === 'update'
                  ? parsePurchaseOrderUpdate(mutation.input)
                  : parsePurchaseOrderVersion(mutation.input)
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...readStores, 'audit', 'purchaseOrderMutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const order = await writePurchaseOrder(transaction, metadata, actor, {
                    ...mutation,
                    input,
                    hash,
                })
                return presentPurchaseOrder(order, actor, generation)
            },
            signal,
        )
    }
}
