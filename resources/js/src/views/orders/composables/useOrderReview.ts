import type { Ref } from 'vue'
import type { Order } from '@/core/types/order'
import { useRecordReview } from '@/composables/useRecordReview'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import { canActOnOrder } from '@/core/domain/order-policy'
import { useOrderApi } from './useOrderApi'
export function useOrderReview(
    order: Ref<Order | undefined>,
    refresh: () => Promise<void>,
    id: () => unknown,
): ReturnType<typeof useRecordReview<Order>> {
    return useRecordReview(order, refresh, id, {
        resource: 'orders',
        api: useOrderApi(),
        canAct: canActOnOrder,
        recovery: useOrderRecoveryStore(),
    })
}
