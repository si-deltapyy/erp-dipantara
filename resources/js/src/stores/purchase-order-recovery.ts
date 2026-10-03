import { defineStore } from 'pinia'
import type {
    PurchaseOrder,
    PurchaseOrderDetail,
    PurchaseOrderWriteInput,
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
        form: {
            readonly actorId: string
            readonly order?: PurchaseOrderDetail
            readonly draft: PurchaseOrderWriteInput
            readonly idempotencyKey: string
        } | null
        snapshot: PurchaseOrderRecovery | null
        review: PurchaseOrderReviewRecovery | null
    } => ({ form: null, snapshot: null, review: null }),
})
