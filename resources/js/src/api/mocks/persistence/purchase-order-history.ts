import type { DemoTransaction } from './transaction'
import type { SessionUser } from '@/core/types/session'
import type { PurchaseOrderQuery } from '@/core/types/purchase-order'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
export async function relatedPurchaseOrderIds(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: PurchaseOrderQuery,
): Promise<Set<string> | undefined> {
    if (!query.mitraId && !query.graderId) return undefined
    const orders = new Map((await transaction.list('orders')).map((order) => [order.id, order]))
    const matches = new Set<string>()
    for (const assignment of await transaction.list('assignments')) {
        if (evaluateRecordAccess(actor, 'assignments.read', assignment) !== 'allowed') continue
        if (query.mitraId && assignment.mitraId !== query.mitraId) continue
        if (query.graderId && assignment.graderId !== query.graderId) continue
        const order = orders.get(assignment.orderId)
        if (order) matches.add(order.purchaseOrderId)
    }
    return matches
}
