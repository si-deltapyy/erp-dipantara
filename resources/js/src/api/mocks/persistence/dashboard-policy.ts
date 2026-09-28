import type { SessionUser } from '@/core/types/session'
import type { BusinessOperation } from '@/core/constants/business-permissions'
import { ApiError } from '@/core/types/api-error'
import { hasBusinessPermission } from '@/core/domain/record-policy'
export function requireDashboardActor(user: SessionUser | null): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(user, 'dashboard.read')) throw new ApiError('forbidden')
    return user
}
export function hasDashboardDrilldown(user: SessionUser, operation: BusinessOperation): boolean {
    if (!hasBusinessPermission(user, operation)) return false
    if (user.permissions.includes('dashboard.read.all')) return true
    if (user.permissions.includes(`${operation}.all`)) return false
    return ['own', 'assigned'].every(
        (scope) =>
            !user.permissions.includes(`${operation}.${scope}`) ||
            user.permissions.includes(`dashboard.read.${scope}`),
    )
}
