import { defineStore } from 'pinia'
import type {
    PurchaseOrder,
    PurchaseOrderInput,
    PurchaseOrderReviewAction,
} from '@/core/types/purchase-order'
export interface PurchaseOrderRecovery {
    readonly actorId: string
    readonly order?: PurchaseOrder
    readonly draft: PurchaseOrderInput
    readonly idempotencyKey: string
    readonly action: 'save' | 'submit'
}
export interface PurchaseOrderReviewRecovery {
    readonly actorId: string
    readonly order: PurchaseOrder
    readonly action: PurchaseOrderReviewAction
    readonly reason: string
    readonly idempotencyKey: string
}
export const usePurchaseOrderRecoveryStore = defineStore('purchase-order-recovery', {
    state: (): {
        snapshot: PurchaseOrderRecovery | null
        review: PurchaseOrderReviewRecovery | null
    } => ({ snapshot: null, review: null }),
})
