import type { SessionUser } from '@/core/types/session'
import type { Grader } from '@/core/types/grader'
import { ApiError } from '@/core/types/api-error'
import { canProvisionGrader } from '@/core/domain/grader-policy'

export function requireGraderPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'lookup' | 'provision',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!user.permissions.includes('graders.' + action + '.all')) throw new ApiError('forbidden')
    return user
}
export function presentGrader(grader: Grader, user: SessionUser): Grader {
    return {
        ...grader,
        allowedActions: [
            ...(user.permissions.includes('graders.update.all') ? ['update'] : []),
            ...(user.permissions.includes('graders.provision.all') &&
            canProvisionGrader(grader.provisioningStatus)
                ? ['provision']
                : []),
        ],
    }
}
