import type { Grading } from '@/core/types/grading'
import type { SessionUser } from '@/core/types/session'
import { hasBusinessPermission } from './record-policy'
export function canActOnGrading(
    actor: SessionUser | null,
    grading: Grading,
    action: 'update' | 'submit' | 'approve' | 'reject' | 'revise',
): boolean {
    if (
        !actor ||
        !hasBusinessPermission(actor, `gradings.${action}`) ||
        !grading.allowedActions.includes(action)
    )
        return false
    if (action === 'approve' || action === 'reject')
        return (
            grading.status === 'submitted' &&
            actor.id !== grading.createdByUserId &&
            actor.id !== grading.submittedByUserId
        )
    return action === 'revise'
        ? grading.status === 'approved'
        : ['draft', 'rejected'].includes(grading.status)
}
