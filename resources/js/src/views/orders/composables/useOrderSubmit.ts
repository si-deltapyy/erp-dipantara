import type { Ref } from 'vue'
import type { Order } from '@/core/types/order'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import { canActOnOrder } from '@/core/domain/order-policy'
import { useOrderApi } from './useOrderApi'
export function useOrderSubmit(
    order: Ref<Order | undefined>,
): ReturnType<typeof useRecordSubmit<Order>> {
    const recovery = useOrderRecoveryStore()
    return useRecordSubmit(order, {
        resource: 'orders',
        api: useOrderApi(),
        canAct: canActOnOrder,
        snapshot: () => recovery.submission,
        recover: (record, idempotencyKey, actorId) => {
            recovery.submission = { record, idempotencyKey, actorId }
        },
        clear: () => {
            recovery.submission = null
        },
    })
}
