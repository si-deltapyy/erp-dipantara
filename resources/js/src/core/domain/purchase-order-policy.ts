import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { SessionUser } from '@/core/types/session'
import { evaluateRecordAccess, hasBusinessPermission } from './record-policy'

export function canCreatePurchaseOrder(actor: SessionUser | null): boolean {
    return hasBusinessPermission(actor, 'purchase-orders.create')
}
export function isEditablePurchaseOrder(order: PurchaseOrder): boolean {
    return order.status === 'draft' || order.status === 'rejected'
}
export function canActOnPurchaseOrder(
    actor: SessionUser | null,
    order: PurchaseOrder,
    action: 'update' | 'submit' | 'approve' | 'reject',
): boolean {
    return (
        (action === 'approve' || action === 'reject'
            ? order.status === 'submitted'
            : isEditablePurchaseOrder(order)) &&
        order.allowedActions.includes(action) &&
        evaluateRecordAccess(actor, `purchase-orders.${action}`, order) === 'allowed'
    )
}
