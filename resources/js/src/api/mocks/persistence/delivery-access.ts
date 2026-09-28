import type { Delivery } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'

export async function scopedDelivery(
    transaction: DemoTransaction,
    actor: SessionUser,
    delivery: Delivery,
): Promise<Delivery | undefined> {
    const parent = await transaction.get('purchase-orders', delivery.purchaseOrderId)
    if (!parent) return undefined
    const full =
        actor.permissions.includes('deliveries.read.all') ||
        (actor.permissions.includes('deliveries.read.own') && parent.createdByUserId === actor.id)
    if (full) return { ...delivery, ownerUserId: parent.createdByUserId }
    if (!actor.permissions.includes('deliveries.read.assigned')) return undefined
    const assigned = new Set(
        (await transaction.list('assignments'))
            .filter((assignment) => assignment.graderUserId === actor.id)
            .map((assignment) => assignment.id),
    )
    const allocationContext = delivery.allocationContext.filter((row) =>
        assigned.has(row.assignmentId),
    )
    if (!allocationContext.length) return undefined
    return {
        ...delivery,
        ownerUserId: parent.createdByUserId,
        allocations: allocationContext.map(({ gradingId, rowId, quantity }) => ({
            gradingId,
            rowId,
            quantity,
        })),
        allocationContext,
        documents: [],
        allowedActions: [],
    }
}
