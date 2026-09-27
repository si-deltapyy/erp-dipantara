import type { SessionUser } from '@/core/types/session'
import type { Buyer } from '@/core/types/buyer'
import { ApiError } from '@/core/types/api-error'

export function requireBuyerPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'lookup',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    const scopes = action === 'lookup' ? ['all', 'own', 'assigned'] : ['all']
    if (!scopes.some((scope) => user.permissions.includes(`buyers.${action}.${scope}`)))
        throw new ApiError('forbidden')
    return user
}
export function presentBuyer(buyer: Buyer, user: SessionUser): Buyer {
    return {
        ...buyer,
        allowedActions: user.permissions.includes('buyers.update.all') ? ['update'] : [],
    }
}
