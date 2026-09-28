import { hasBusinessPermission } from '@/core/domain/record-policy'
import type { Delivery } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
export function requireDeliveryPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'dispatch' | 'receive',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (
        action === 'read'
            ? !hasBusinessPermission(user, 'deliveries.read')
            : !user.permissions.includes(`deliveries.${action}.all`)
    )
        throw new ApiError('forbidden')
    return user
}
export function presentDelivery(
    delivery: Delivery,
    actor: SessionUser,
    generation: string,
): Delivery {
    return {
        ...delivery,
        snapshotGeneration: generation,
        allowedActions: ['update', 'dispatch', 'receive'].filter((action) => {
            if (!actor.permissions.includes(`deliveries.${action}.all`)) return false
            if (action === 'receive') return delivery.status === 'dispatched'
            return (
                delivery.status === 'draft' &&
                (action === 'update' || delivery.documents.length === 2)
            )
        }),
    }
}
