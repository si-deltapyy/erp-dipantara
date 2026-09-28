import type { ReviewSnapshot } from '@/core/types/workflow'
import { defineStore } from 'pinia'
import type { Payment, PaymentInput } from '@/core/types/payment'
export const usePaymentRecoveryStore = defineStore('payment-recovery', {
    state: (): {
        review: ReviewSnapshot<Payment> | null
        submit: { actorId: string; record: Payment; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            payment?: Payment
            draft: PaymentInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, submit: null, review: null }),
})
