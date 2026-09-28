import type { SessionUser } from '@/core/types/session'
import type { ReportQuery } from '@/core/types/report'
import type { PurchasePriceRow } from '@/core/types/purchase-price-report'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { aggregateProduction } from './production-projector'
import { filteredProductionSource, requireReportActor } from './report-projection'
import { sumGradingVolumes } from '../grading-volume'
export function requirePurchasePriceActor(user: SessionUser | null): SessionUser {
    const actor = requireReportActor(user)
    if (
        !actor.permissions.includes('reports.read.all') ||
        !actor.permissions.includes('timber-prices.read.all')
    )
        throw new ApiError('forbidden')
    return actor
}
export async function purchasePriceRows(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: ReportQuery,
): Promise<readonly PurchasePriceRow[]> {
    requirePurchasePriceActor(actor)
    const source = await filteredProductionSource(transaction, actor, query)
    const orders = new Map((await transaction.list('orders')).map((order) => [order.id, order]))
    const purchaseOrders = new Map(
        (await transaction.list('purchase-orders')).map((order) => [order.id, order]),
    )
    const groups = new Map<string, PurchasePriceRow>()
    for (const entry of source) {
        const order = orders.get(entry.assignment.orderId)
        const purchaseOrder = order && purchaseOrders.get(order.purchaseOrderId)
        if (!purchaseOrder) continue
        for (const row of aggregateProduction([entry], query.period)) {
            if (query.timberProductId && row.timberProductId !== query.timberProductId) continue
            if (query.category && row.category !== query.category) continue
            if (
                !row.timberProductName
                    .toLocaleLowerCase('id')
                    .includes(query.search.toLocaleLowerCase('id'))
            )
                continue
            const key = [
                purchaseOrder.id,
                entry.assignment.mitraId,
                row.timberProductId,
                row.category,
            ].join(':')
            const previous = groups.get(key)
            groups.set(key, {
                ...row,
                quantity: (previous?.quantity ?? 0) + row.quantity,
                volumeM3: sumGradingVolumes(previous ? [previous, row] : [row]),
                purchaseOrderId: purchaseOrder.id,
                purchaseOrderNumber: purchaseOrder.number,
                mitraId: entry.assignment.mitraId,
                mitraName: entry.assignment.mitraName,
                sourceStatus: 'missing_snapshot',
                unitPrice: null,
                totalAmount: null,
                priceBasis: null,
                priceAsOf: null,
            })
        }
    }
    const sorted = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row)
    return query.sort === '-createdAt' ? sorted.reverse() : sorted
}
