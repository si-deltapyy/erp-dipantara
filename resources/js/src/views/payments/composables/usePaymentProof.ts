import type { Payment, PaymentInput } from '@/core/types/payment'
import type { Invoice } from '@/core/types/invoice'
import type { Ref } from 'vue'
import { useDocumentTransfer } from '@/composables/useDocumentTransfer'
import { useSessionStore } from '@/stores/session'
import { usePaymentRecoveryStore } from '@/stores/payment-recovery'
export function usePaymentProof(
    invoice: () => Invoice,
    payment: Payment | undefined,
    draft: Ref<PaymentInput>,
    permitted: () => boolean,
): ReturnType<typeof useDocumentTransfer> {
    const session = useSessionStore()
    const recovery = usePaymentRecoveryStore()
    return useDocumentTransfer(
        () => ({
            identity: `payment-proof:${payment?.id ?? invoice().id}`,
            parentType: 'payment',
            parentId: null,
            purpose: 'payment_proof',
            scope: { createdByUserId: session.user?.id ?? '', ownerUserId: invoice().ownerUserId },
            permitted: permitted(),
        }),
        async (document) => {
            draft.value = { ...draft.value, proofDocumentId: document.id }
        },
        () => {
            if (session.user)
                recovery.snapshot = {
                    actorId: session.user.id,
                    payment,
                    draft: { ...draft.value },
                    idempotencyKey: crypto.randomUUID(),
                }
        },
    )
}
