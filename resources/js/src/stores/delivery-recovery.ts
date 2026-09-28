import { defineStore } from 'pinia'
import type { Delivery, DeliveryInput } from '@/core/types/delivery'
export const useDeliveryRecoveryStore = defineStore('delivery-recovery', {
    state: (): {
        snapshot: {
            actorId: string
            delivery?: Delivery
            draft: DeliveryInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null }),
})
