import type { Closing } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { ReviewAction } from '@/core/types/workflow'
import { evaluateRecordAccess } from './record-policy'
export function canReviewClosing(
    actor: SessionUser | null,
    closing: Closing,
    action: ReviewAction,
): boolean {
    return (
        closing.status === 'requested' &&
        closing.allowedActions.includes(action) &&
        evaluateRecordAccess(actor, `closings.${action}`, closing) === 'allowed'
    )
}
