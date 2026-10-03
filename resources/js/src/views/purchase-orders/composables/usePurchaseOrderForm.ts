import { integrationPermissions } from '@/core/constants/business-permissions'
import { canAccess } from '@/core/domain/access-policy'
import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import type { PurchaseOrderDetail, PurchaseOrderWriteInput } from '@/core/types/purchase-order'
import {
    purchaseOrderWriteDraft,
    validatePurchaseOrderWrite,
} from '@/core/domain/purchase-order-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'
import { ApiError } from '@/core/types/api-error'

export function usePurchaseOrderForm(
    order: PurchaseOrderDetail | undefined,
    saved: (order: { readonly id: string }) => void,
): ReturnType<typeof useMasterForm<PurchaseOrderWriteInput>> & { permitted: ComputedRef<boolean> } {
    const api = usePurchaseOrderApi()
    const store = useSessionStore()
    const recovery = usePurchaseOrderRecoveryStore()
    const snapshot =
        recovery.form?.actorId === store.user?.id && recovery.form?.order?.id === order?.id
            ? recovery.form
            : null
    recovery.$reset()
    const completed = shallowRef<{ readonly id: string }>()
    const permitted = computed(() =>
        canAccess(
            store.user,
            integrationPermissions[order ? 'purchase-orders.update' : 'purchase-orders.create'],
        ),
    )
    const form = useMasterForm<PurchaseOrderWriteInput>({
        resource: 'purchase-orders',
        retrySafe: false,
        initial: purchaseOrderWriteDraft(order),
        snapshot,
        validate: validatePurchaseOrderWrite,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed.value = order
                ? await api.update(order.id, draft, { signal, idempotencyKey })
                : await api.create(draft, { signal, idempotencyKey })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.form = { actorId, order, draft, idempotencyKey }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted }
}
