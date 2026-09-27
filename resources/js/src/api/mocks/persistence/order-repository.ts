import type { Order, OrderQuery } from '@/core/types/order'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess, evaluateRecordAccess } from '@/core/domain/record-policy'
import { parseOrderInput, parseOrderQuery } from '@/api/order-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { presentOrder, requireOrderPermission } from '../order-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeOrder } from './order-mutation'
import type { OrderMutation } from './order-mutation'
import { resolveOrderLabels } from './order-labels'
import type { DemoStore } from './schema'

const readStores: readonly DemoStore[] = [
    'metadata',
    'orders',
    'purchase-orders',
    'buyers',
    'timber-products',
]
export class OrderRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: OrderQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Order>> {
        const actor = requireOrderPermission(user, 'read')
        const filter = parseOrderQuery(query)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const scoped = (await transaction.list('orders')).filter(
                    (order) => evaluateRecordAccess(actor, 'orders.read', order) === 'allowed',
                )
                const labeled = await Promise.all(
                    scoped.map((order) => resolveOrderLabels(transaction, order)),
                )
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = labeled
                    .filter(
                        (order) =>
                            (!filter.purchaseOrderId ||
                                order.purchaseOrderId === filter.purchaseOrderId) &&
                            (!filter.status || order.status === filter.status) &&
                            [order.purchaseOrderNumber, order.buyerName].some((value) =>
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
                        .map((order) => presentOrder(order, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Order> {
        const actor = requireOrderPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            readStores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const order = await transaction.get('orders', id)
                if (!order) throw new ApiError('not-found')
                assertRecordAccess(actor, 'orders.read', order)
                return presentOrder(
                    await resolveOrderLabels(transaction, order),
                    actor,
                    metadata.generation,
                )
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<OrderMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Order> {
        const actor = requireOrderPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input = parseOrderInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...readStores, 'audit', 'orderMutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const order = await writeOrder(transaction, metadata, actor, {
                    ...mutation,
                    input,
                    hash,
                })
                return presentOrder(order, actor, generation)
            },
            signal,
        )
    }
}
