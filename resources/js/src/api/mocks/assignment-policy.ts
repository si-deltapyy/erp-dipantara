import type { SessionUser } from '@/core/types/session'
import type { Assignment } from '@/core/types/assignment'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
import { ApiError } from '@/core/types/api-error'
export function requireAssignmentPermission(
    actor: SessionUser | null,
    action: 'read' | 'create' | 'update',
): SessionUser {
    if (!actor) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(actor, `assignments.${action}`)) throw new ApiError('forbidden')
    return actor
}
export function presentAssignment(
    assignment: Assignment,
    actor: SessionUser,
    generation: string,
): Assignment {
    return {
        ...assignment,
        snapshotGeneration: generation,
        allowedActions:
            ['draft', 'rejected'].includes(assignment.orderStatus) &&
            evaluateRecordAccess(actor, 'assignments.update', assignment) === 'allowed'
                ? ['update']
                : [],
    }
}
