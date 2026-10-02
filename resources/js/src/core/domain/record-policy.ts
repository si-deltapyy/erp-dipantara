import type { SessionUser } from '@/core/types/session'
import type { BusinessOperation, BusinessPermission } from '@/core/constants/business-permissions'
import { businessPermissions } from '@/core/constants/business-permissions'
import { ApiError } from '@/core/types/api-error'

export interface RecordScope {
    readonly createdByUserId: string
    readonly submittedByUserId?: string | null
    readonly ownerUserId?: string
    readonly graderUserId?: string | null
}
export type PolicyDecision = 'allowed' | 'forbidden' | 'not-found'

export function hasBusinessPermission(
    user: SessionUser | null,
    operation: BusinessOperation,
): boolean {
    return (
        !!user &&
        businessPermissions.some(
            (permission) =>
                permission.startsWith(`${operation}.`) && user.permissions.includes(permission),
        )
    )
}
export function canReadPrices(user: SessionUser | null): boolean {
    return !!user?.permissions.includes('timber-prices.read.all')
}
export function evaluateRecordAccess(
    user: SessionUser | null,
    operation: BusinessOperation,
    record: RecordScope,
): PolicyDecision {
    if (!user || !hasBusinessPermission(user, operation)) return 'forbidden'
    const granted = (scope: string): boolean => {
        const permission = `${operation}.${scope}` as BusinessPermission
        return businessPermissions.includes(permission) && user.permissions.includes(permission)
    }
    const inScope =
        granted('all') ||
        (granted('own') && (record.ownerUserId ?? record.createdByUserId) === user.id) ||
        (granted('assigned') && record.graderUserId === user.id)
    if (!inScope) return 'not-found'
    const action = operation.split('.')[1]
    if (
        (action === 'approve' || action === 'reject') &&
        (record.createdByUserId === user.id || record.submittedByUserId === user.id)
    )
        return 'forbidden'
    return 'allowed'
}
export function assertRecordAccess(
    user: SessionUser | null,
    operation: BusinessOperation,
    record: RecordScope,
): void {
    if (!user) throw new ApiError('unauthenticated')
    const decision = evaluateRecordAccess(user, operation, record)
    if (decision !== 'allowed') throw new ApiError(decision)
}
