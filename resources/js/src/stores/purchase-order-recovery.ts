import { defineStore } from 'pinia'
import type { PurchaseOrder, PurchaseOrderInput } from '@/core/types/purchase-order'
export interface PurchaseOrderRecovery {
    readonly actorId: string
    readonly order?: PurchaseOrder
    readonly draft: PurchaseOrderInput
    readonly idempotencyKey: string
    readonly action: 'save' | 'submit'
}
export const usePurchaseOrderRecoveryStore = defineStore('purchase-order-recovery', {
    state: (): { snapshot: PurchaseOrderRecovery | null } => ({ snapshot: null }),
})
