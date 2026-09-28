import type { Payment } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import { hasBusinessPermission, evaluateRecordAccess } from './record-policy'
export function canCreatePayment(user: SessionUser | null): boolean {
    return hasBusinessPermission(user, 'payments.create')
}
export function canActOnPayment(
    user: SessionUser | null,
    payment: Payment,
    action: 'update' | 'submit',
): boolean {
    return (
        ['draft', 'rejected'].includes(payment.status) &&
        payment.allowedActions.includes(action) &&
        evaluateRecordAccess(user, `payments.${action}`, payment) === 'allowed'
    )
}
