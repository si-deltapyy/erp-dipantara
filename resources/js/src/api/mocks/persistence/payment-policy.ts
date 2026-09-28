import type { Payment } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
export type PaymentAction = 'create' | 'read' | 'update' | 'submit' | 'approve' | 'reject'
export function requirePaymentPermission(
    user: SessionUser | null,
    action: PaymentAction,
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(user, `payments.${action}`)) throw new ApiError('forbidden')
    return user
}
export function presentPayment(payment: Payment, actor: SessionUser, generation: string): Payment {
    return {
        ...payment,
        snapshotGeneration: generation,
        allowedActions: (['update', 'submit', 'approve', 'reject'] as const).filter(
            (action) =>
                (action === 'approve' || action === 'reject'
                    ? payment.status === 'submitted'
                    : ['draft', 'rejected'].includes(payment.status)) &&
                evaluateRecordAccess(actor, `payments.${action}`, payment) === 'allowed',
        ),
    }
}
