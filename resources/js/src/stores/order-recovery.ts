import { defineStore } from 'pinia'
import type { Order, OrderInput } from '@/core/types/order'
export const useOrderRecoveryStore = defineStore('order-recovery', {
    state: (): {
        snapshot: {
            actorId: string
            order?: Order
            draft: OrderInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null }),
})
