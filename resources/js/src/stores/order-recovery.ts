import type { ReviewSnapshot } from '@/core/types/workflow'
import { defineStore } from 'pinia'
import type { Order, OrderCreateInput } from '@/core/types/order'
export const useOrderRecoveryStore = defineStore('order-recovery', {
    state: (): {
        review: ReviewSnapshot<Order> | null
        submission: { actorId: string; record: Order; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            order?: Order
            draft: OrderCreateInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, review: null, submission: null }),
})
