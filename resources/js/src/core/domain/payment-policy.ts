import type { Payment } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import { evaluateRecordAccess, hasBusinessPermission } from './record-policy'

export function canCreatePayment(actor: SessionUser | null): boolean {
    return hasBusinessPermission(actor, 'payments.create')
}
export function isEditablePayment(payment: Payment): boolean {
    return payment.status === 'draft' || payment.status === 'rejected'
}
export function canActOnPayment(
    actor: SessionUser | null,
    payment: Payment,
    action: 'update' | 'submit' | 'approve' | 'reject',
): boolean {
    return (
        (action === 'approve' || action === 'reject'
            ? payment.status === 'submitted'
            : isEditablePayment(payment)) &&
        payment.allowedActions.includes(action) &&
        evaluateRecordAccess(actor, `payments.${action}`, payment) === 'allowed'
    )
}
