import type { Ref } from 'vue'
import type { Delivery } from '@/core/types/delivery'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { useDeliveryRecoveryStore } from '@/stores/delivery-recovery'
import { canActOnDelivery } from '@/core/domain/delivery-policy'
import { useDeliveryApi } from './useDeliveryApi'
export function useDeliveryTransition(
    delivery: Ref<Delivery | undefined>,
    action: 'dispatch' | 'receive',
): ReturnType<typeof useRecordSubmit<Delivery>> {
    const recovery = useDeliveryRecoveryStore()
    const api = useDeliveryApi()
    return useRecordSubmit(delivery, {
        resource: 'deliveries',
        api: { submit: (id, input, options) => api[action](id, input, options) },
        canAct: (actor, delivery) => canActOnDelivery(actor, delivery, action),
        snapshot: () => recovery[action],
        recover: (record, idempotencyKey, actorId) => {
            recovery[action] = { record, idempotencyKey, actorId }
        },
        clear: () => {
            recovery[action] = null
        },
    })
}
