import type { SessionUser } from '@/core/types/session'
import type { TimberProduct } from '@/core/types/timber-product'
import { canReadPrices } from '@/core/domain/record-policy'
import { ApiError } from '@/core/types/api-error'

export function requireTimberProductPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'lookup',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    const scopes = action === 'lookup' ? ['all', 'own', 'assigned'] : ['all']
    if (!scopes.some((scope) => user.permissions.includes(`timber-products.${action}.${scope}`)))
        throw new ApiError('forbidden')
    if ((action === 'create' || action === 'update') && !canReadPrices(user))
        throw new ApiError('forbidden')
    return user
}
export function presentTimberProduct(product: TimberProduct, user: SessionUser): TimberProduct {
    const { purchasePrice, salePrice, ...specification } = product
    return {
        ...specification,
        ...(canReadPrices(user) ? { purchasePrice, salePrice } : {}),
        allowedActions:
            canReadPrices(user) && user.permissions.includes('timber-products.update.all')
                ? ['update']
                : [],
    }
}
