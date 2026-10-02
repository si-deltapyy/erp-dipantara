import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { Payment, PaymentInput } from '@/core/types/payment'
import { paymentDraft, validatePayment } from '@/core/domain/payment-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { usePaymentRecoveryStore } from '@/stores/payment-recovery'
import { usePaymentApi } from './usePaymentApi'
import { canActOnPayment, canCreatePayment } from '@/core/domain/payment-policy'
import { ApiError } from '@/core/types/api-error'
type PaymentFormState = ReturnType<typeof useMasterForm<PaymentInput>> & {
    permitted: ComputedRef<boolean>
}
export function usePaymentForm(
    payment: Payment | undefined,
    saved: (payment: Payment) => void,
    invoiceId: string,
): PaymentFormState {
    const api = usePaymentApi()
    const store = useSessionStore()
    const recovery = usePaymentRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate &&
        candidate.actorId === actorId &&
        candidate.payment?.id === payment?.id &&
        candidate.draft.invoiceId === invoiceId
            ? candidate
            : null
    const baseline = snapshot?.payment ?? payment
    recovery.$reset()
    let completed: Payment | undefined
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline
                ? canActOnPayment(store.user, baseline, 'update')
                : canCreatePayment(store.user)),
    )
    const form = useMasterForm<PaymentInput>({
        resource: 'payments',
        initial: paymentDraft(baseline, invoiceId),
        snapshot,
        validate: validatePayment,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration,
            }
            completed = baseline
                ? await api.update(
                      baseline.id,
                      {
                          ...draft,
                          version: baseline.version,
                      },
                      options,
                  )
                : await api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, payment: baseline, draft, idempotencyKey }
        },
        saved: () => {
            if (completed) saved(completed)
        },
    })
    return { ...form, permitted }
}
