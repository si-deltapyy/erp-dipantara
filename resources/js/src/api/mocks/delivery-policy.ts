import type { Delivery } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
export function requireDeliveryPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!user.permissions.includes(`deliveries.${action}.all`)) throw new ApiError('forbidden')
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
        allowedActions:
            delivery.status === 'draft' && actor.permissions.includes('deliveries.update.all')
                ? ['update']
                : [],
    }
}
