import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import type { OrderCreateInput } from '@/core/types/order'
import { emptyOrderCreate, validateOrderCreate } from '@/core/domain/order-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import { useOrderApi } from './useOrderApi'
import { ApiError } from '@/core/types/api-error'
export function useOrderForm(
    saved: (order: { readonly id: string }) => void,
): ReturnType<typeof useMasterForm<OrderCreateInput>> & { permitted: ComputedRef<boolean> } {
    const api = useOrderApi()
    const store = useSessionStore()
    const recovery = useOrderRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    const completed = shallowRef<{ readonly id: string }>()
    const permitted = computed(() =>
        [
            'orders.read.all',
            'orders.create.all',
            'purchase-orders.read.all',
            'mitras.read.all',
            'graders.read.all',
            'timber-prices.read.all',
        ].every((permission) => store.user?.permissions.includes(permission)),
    )
    const form = useMasterForm<OrderCreateInput>({
        resource: 'orders',
        retrySafe: false,
        initial: emptyOrderCreate(),
        snapshot,
        validate: validateOrderCreate,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed.value = await api.create(draft, { signal, idempotencyKey })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, draft, idempotencyKey }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted }
}
