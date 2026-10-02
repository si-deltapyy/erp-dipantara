import type { Ref } from 'vue'
import type { Payment } from '@/core/types/payment'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { usePaymentRecoveryStore } from '@/stores/payment-recovery'
import { canActOnPayment } from '@/core/domain/payment-policy'
import { usePaymentApi } from './usePaymentApi'
export function usePaymentSubmit(
    payment: Ref<Payment | undefined>,
): ReturnType<typeof useRecordSubmit<Payment>> {
    const recovery = usePaymentRecoveryStore()
    const api = usePaymentApi()
    return useRecordSubmit(payment, {
        resource: 'payments',
        api,
        canAct: (actor, payment) => canActOnPayment(actor, payment, 'submit'),
        snapshot: () => recovery.submit,
        recover: (record, idempotencyKey, actorId) => {
            recovery.submit = { record, idempotencyKey, actorId }
        },
        clear: () => {
            recovery.submit = null
        },
    })
}
