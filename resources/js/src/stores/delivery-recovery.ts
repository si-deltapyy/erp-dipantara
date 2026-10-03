import { defineStore } from 'pinia'
import type { Delivery, DeliveryCreateInput } from '@/core/types/delivery'
export const useDeliveryRecoveryStore = defineStore('delivery-recovery', {
    state: (): {
        dispatch: { actorId: string; record: Delivery; idempotencyKey: string } | null
        receive: { actorId: string; record: Delivery; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            delivery?: Delivery
            draft: DeliveryCreateInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, dispatch: null, receive: null }),
})
