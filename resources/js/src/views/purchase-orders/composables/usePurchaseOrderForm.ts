import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowRef } from 'vue'
import type { PurchaseOrder, PurchaseOrderInput } from '@/core/types/purchase-order'
import { purchaseOrderDraft, validatePurchaseOrder } from '@/core/domain/purchase-order-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'
import { canActOnPurchaseOrder, canCreatePurchaseOrder } from '@/core/domain/purchase-order-policy'
import { ApiError } from '@/core/types/api-error'

type PurchaseOrderFormState = ReturnType<typeof useMasterForm<PurchaseOrderInput>> & {
    permitted: ComputedRef<boolean>
    completed: ShallowRef<PurchaseOrder | undefined>
}

export function usePurchaseOrderForm(
    order: PurchaseOrder | undefined,
    saved: (order: PurchaseOrder) => void,
): PurchaseOrderFormState {
    const api = usePurchaseOrderApi()
    const store = useSessionStore()
    const recovery = usePurchaseOrderRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate &&
        candidate.actorId === actorId &&
        candidate.action === 'save' &&
        candidate.order?.id === order?.id
            ? candidate
            : null
    const baseline = snapshot?.order ?? order
    recovery.$reset()
    const completed = shallowRef<PurchaseOrder>()
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline
                ? canActOnPurchaseOrder(store.user, baseline, 'update')
                : canCreatePurchaseOrder(store.user)),
    )
    const form = useMasterForm<PurchaseOrderInput>({
        resource: 'purchase-orders',
        initial: purchaseOrderDraft(baseline),
        snapshot,
        validate: validatePurchaseOrder,
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
                draft: purchaseOrderDraft(draft),
                idempotencyKey,
                action: 'save',
            }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted, completed }
}
