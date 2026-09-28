import type { ReportQuery } from '@/core/types/report'
import type { SessionUser } from '@/core/types/session'
import type { ProductionRow } from '@/core/types/production'
import type { DemoTransaction } from './transaction'
import type { DemoStore } from './schema'
import { ApiError } from '@/core/types/api-error'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { scopedProductionSource, aggregateProduction } from './production-projector'
import type { ProductionSource } from './production-projector'
export const reportStores: readonly DemoStore[] = [
    'metadata',
    'purchase-orders',
    'orders',
    'assignments',
    'gradings',
]
export function requireReportActor(user: SessionUser | null): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(user, 'reports.read')) throw new ApiError('forbidden')
    return user
}
export async function filteredProductionSource(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: ReportQuery,
): Promise<readonly ProductionSource[]> {
    const source = await scopedProductionSource(transaction, actor, 'reports.read')
    const orders = new Map((await transaction.list('orders')).map((order) => [order.id, order]))
    const purchaseOrders = new Map(
        (await transaction.list('purchase-orders')).map((order) => [order.id, order]),
    )
    return source.filter(({ grading, assignment }) => {
        const order = orders.get(assignment.orderId)
        const purchaseOrder = order && purchaseOrders.get(order.purchaseOrderId)
        return (
            !!purchaseOrder &&
            grading.gradingDate.startsWith(query.period + '-') &&
            (!query.buyerId || purchaseOrder.buyerId === query.buyerId) &&
            (!query.mitraId || assignment.mitraId === query.mitraId) &&
            (!query.graderId || assignment.graderId === query.graderId)
        )
    })
}
export async function productionReportRows(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: ReportQuery,
): Promise<readonly ProductionRow[]> {
    const rows = aggregateProduction(
        await filteredProductionSource(transaction, actor, query),
        query.period,
    ).filter(
        (row) =>
            (!query.timberProductId || row.timberProductId === query.timberProductId) &&
            (!query.category || row.category === query.category) &&
            row.timberProductName
                .toLocaleLowerCase('id')
                .includes(query.search.toLocaleLowerCase('id')),
    )
    return query.sort === '-createdAt' ? rows.reverse() : rows
}
