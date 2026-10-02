import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { Delivery, DeliveryInput } from '@/core/types/delivery'
import { deliveryDraft, validateDelivery } from '@/core/domain/delivery-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useDeliveryRecoveryStore } from '@/stores/delivery-recovery'
import { useDeliveryApi } from './useDeliveryApi'
import { canActOnDelivery, canCreateDelivery } from '@/core/domain/delivery-policy'
import { ApiError } from '@/core/types/api-error'
type DeliveryFormState = ReturnType<typeof useMasterForm<DeliveryInput>> & {
    permitted: ComputedRef<boolean>
}
export function useDeliveryForm(
    delivery: Delivery | undefined,
    saved: (delivery: Delivery) => void,
): DeliveryFormState {
    const api = useDeliveryApi()
    const store = useSessionStore()
    const recovery = useDeliveryRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate && candidate.actorId === actorId && candidate.delivery?.id === delivery?.id
            ? candidate
            : null
    const baseline = snapshot?.delivery ?? delivery
    recovery.$reset()
    let completed: Delivery | undefined
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline
                ? canActOnDelivery(store.user, baseline, 'update')
                : canCreateDelivery(store.user)),
    )
    const form = useMasterForm<DeliveryInput>({
        resource: 'deliveries',
        initial: deliveryDraft(baseline),
        snapshot,
        validate: validateDelivery,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration,
            }
            completed = baseline
                ? await api.update(baseline.id, { ...draft, version: baseline.version }, options)
                : await api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, delivery: baseline, draft, idempotencyKey }
        },
        saved: () => {
            if (completed) saved(completed)
        },
    })
    const dirty = computed(
        () =>
            JSON.stringify({ ...form.draft.value, availabilityToken: '' }) !==
            JSON.stringify(deliveryDraft(baseline)),
    )
    return { ...form, dirty, permitted }
}
