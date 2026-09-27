import type { SessionUser } from '@/core/types/session'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
import { isEditablePurchaseOrder } from '@/core/domain/purchase-order-policy'
import { ApiError } from '@/core/types/api-error'

export function requirePurchaseOrderPermission(
    actor: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'submit' | 'approve' | 'reject',
): SessionUser {
    if (!actor) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(actor, `purchase-orders.${action}`)) throw new ApiError('forbidden')
    return actor
}
export function presentPurchaseOrder(
    order: PurchaseOrder,
    actor: SessionUser,
    generation: string,
): PurchaseOrder {
    return {
        ...order,
        snapshotGeneration: generation,
        allowedActions: isEditablePurchaseOrder(order)
            ? (['update', 'submit'] as const).filter(
                  (action) =>
                      evaluateRecordAccess(actor, `purchase-orders.${action}`, order) === 'allowed',
              )
            : order.status === 'submitted'
              ? (['approve', 'reject'] as const).filter(
                    (action) =>
                        evaluateRecordAccess(actor, `purchase-orders.${action}`, order) ===
                        'allowed',
                )
              : [],
    }
}
