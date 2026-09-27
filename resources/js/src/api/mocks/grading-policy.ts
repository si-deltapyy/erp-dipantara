import type { SessionUser } from '@/core/types/session'
import type { Grading } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
import { ApiError } from '@/core/types/api-error'
export function requireGradingPermission(
    actor: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'submit' | 'approve' | 'reject' | 'revise',
): SessionUser {
    if (!actor) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(actor, `gradings.${action}`)) throw new ApiError('forbidden')
    return actor
}
export function gradingAccess(
    record: Grading,
    assignment: Assignment,
): Grading & { graderUserId: string } {
    return { ...record, graderUserId: assignment.graderUserId }
}
export function presentGrading(
    record: Grading,
    assignment: Assignment,
    actor: SessionUser,
    generation: string,
): Grading {
    const actions: ('update' | 'submit')[] = ['update']
    if (assignment.orderStatus === 'approved') actions.push('submit')
    const editable = ['draft', 'rejected'].includes(record.status)
    return {
        ...record,
        snapshotGeneration: generation,
        allowedActions: (editable ? actions : []).filter(
            (action) =>
                evaluateRecordAccess(
                    actor,
                    `gradings.${action}`,
                    gradingAccess(record, assignment),
                ) === 'allowed',
        ),
    }
}
