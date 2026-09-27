import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowRef } from 'vue'
import type { Order, OrderInput } from '@/core/types/order'
import { orderDraft, validateOrder } from '@/core/domain/order-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import { useOrderApi } from './useOrderApi'
import { canActOnOrder, canCreateOrder } from '@/core/domain/order-policy'
import { ApiError } from '@/core/types/api-error'

type OrderFormState = ReturnType<typeof useMasterForm<OrderInput>> & {
    permitted: ComputedRef<boolean>
    completed: ShallowRef<Order | undefined>
}

export function useOrderForm(
    order: Order | undefined,
    saved: (order: Order) => void,
): OrderFormState {
    const api = useOrderApi()
    const store = useSessionStore()
    const recovery = useOrderRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate && candidate.actorId === actorId && candidate.order?.id === order?.id
            ? candidate
            : null
    const baseline = snapshot?.order ?? order
    recovery.$reset()
    const completed = shallowRef<Order>()
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline ? canActOnOrder(store.user, baseline, 'update') : canCreateOrder(store.user)),
    )
    const form = useMasterForm<OrderInput>({
        resource: 'orders',
        initial: orderDraft(baseline),
        snapshot,
        validate: validateOrder,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration,
            }
            completed.value = baseline
                ? await api.update(baseline.id, { ...draft, version: baseline.version }, options)
                : await api.create(draft, options)
        },
        recover: (draft, idempotencyKey, id) => {
            recovery.snapshot = {
                actorId: id,
                order: baseline,
                draft: orderDraft(draft),
                idempotencyKey,
            }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted, completed }
}
