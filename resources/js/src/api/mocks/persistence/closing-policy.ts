import { evaluateRecordAccess } from '@/core/domain/record-policy'
import type { Closing } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
export function requireClosingPermission(
    user: SessionUser | null,
    action: 'read' | 'request' | 'approve' | 'reject',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!user.permissions.includes(`closings.${action}.all`)) throw new ApiError('forbidden')
    return user
}
export function presentClosing(closing: Closing, actor: SessionUser, generation: string): Closing {
    return {
        ...closing,
        allowedActions:
            closing.status === 'requested'
                ? (['approve', 'reject'] as const).filter(
                      (action) =>
                          evaluateRecordAccess(actor, `closings.${action}`, closing) === 'allowed',
                  )
                : [],
        snapshotGeneration: generation,
    }
}
