import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import type { DeliveryCreateInput } from '@/core/types/delivery'
import { emptyDeliveryCreate, validateDeliveryCreate } from '@/core/domain/delivery-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useDeliveryRecoveryStore } from '@/stores/delivery-recovery'
import { useDeliveryApi } from './useDeliveryApi'
import { ApiError } from '@/core/types/api-error'
export function useDeliveryForm(
    saved: (delivery: { readonly id: string }) => void,
): ReturnType<typeof useMasterForm<DeliveryCreateInput>> & { permitted: ComputedRef<boolean> } {
    const api = useDeliveryApi()
    const store = useSessionStore()
    const recovery = useDeliveryRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    const completed = shallowRef<{ readonly id: string }>()
    const permitted = computed(() =>
        [
            'deliveries.read.all',
            'deliveries.create.all',
            'purchase-orders.read.all',
            'mitras.read.all',
            'graders.read.all',
            'timber-prices.read.all',
        ].every((permission) => store.user?.permissions.includes(permission)),
    )
    const form = useMasterForm<DeliveryCreateInput>({
        resource: 'deliveries',
        retrySafe: false,
        initial: emptyDeliveryCreate(),
        snapshot,
        validate: validateDeliveryCreate,
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
