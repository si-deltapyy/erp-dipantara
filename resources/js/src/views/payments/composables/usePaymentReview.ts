import type { Ref } from 'vue'
import type { Payment } from '@/core/types/payment'
import { useRecordReview } from '@/composables/useRecordReview'
import { usePaymentRecoveryStore } from '@/stores/payment-recovery'
import { canActOnPayment } from '@/core/domain/payment-policy'
import { usePaymentApi } from './usePaymentApi'
export function usePaymentReview(
    payment: Ref<Payment | undefined>,
    refresh: () => Promise<void>,
    id: () => unknown,
): ReturnType<typeof useRecordReview<Payment>> {
    return useRecordReview(payment, refresh, id, {
        resource: 'payments',
        api: usePaymentApi(),
        canAct: canActOnPayment,
        recovery: usePaymentRecoveryStore(),
    })
}
