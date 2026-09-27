import type { Order } from '@/core/types/order'
import type { SessionUser } from '@/core/types/session'
import { evaluateRecordAccess, hasBusinessPermission } from './record-policy'

export function canCreateOrder(actor: SessionUser | null): boolean {
    return hasBusinessPermission(actor, 'orders.create')
}
export function isEditableOrder(order: Order): boolean {
    return order.status === 'draft' || order.status === 'rejected'
}
export function canActOnOrder(
    actor: SessionUser | null,
    order: Order,
    action: 'update' | 'submit' | 'approve' | 'reject',
): boolean {
    return (
        (action === 'approve' || action === 'reject'
            ? order.status === 'submitted'
            : isEditableOrder(order)) &&
        order.allowedActions.includes(action) &&
        evaluateRecordAccess(actor, `orders.${action}`, order) === 'allowed'
    )
}
