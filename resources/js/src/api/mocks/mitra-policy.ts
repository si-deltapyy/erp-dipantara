import type { SessionUser } from '@/core/types/session'
import type { Mitra } from '@/core/types/mitra'
import { ApiError } from '@/core/types/api-error'

export function requireMitraPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'lookup',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    const scopes = action === 'lookup' ? ['all', 'own', 'assigned'] : ['all']
    if (!scopes.some((scope) => user.permissions.includes(`mitras.${action}.${scope}`)))
        throw new ApiError('forbidden')
    return user
}
export function presentMitra(mitra: Mitra, user: SessionUser): Mitra {
    return {
        ...mitra,
        allowedActions: user.permissions.includes('mitras.update.all') ? ['update'] : [],
    }
}
