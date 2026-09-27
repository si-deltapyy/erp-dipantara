import type { SessionUser } from '@/core/types/session'
import type { Order } from '@/core/types/order'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
import { isEditableOrder } from '@/core/domain/order-policy'
import { ApiError } from '@/core/types/api-error'

export function requireOrderPermission(
    actor: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'submit' | 'approve' | 'reject',
): SessionUser {
    if (!actor) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(actor, `orders.${action}`)) throw new ApiError('forbidden')
    return actor
}
export function presentOrder(order: Order, actor: SessionUser, generation: string): Order {
    return {
        ...order,
        snapshotGeneration: generation,
        allowedActions:
            isEditableOrder(order) &&
            evaluateRecordAccess(actor, 'orders.update', order) === 'allowed'
                ? ['update']
                : [],
    }
}
