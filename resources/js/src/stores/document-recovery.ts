import { defineStore } from 'pinia'
import type { PurchaseOrder } from '@/core/types/purchase-order'

export interface DocumentDraft {
    readonly actorId: string
    readonly order: PurchaseOrder
    readonly file: File
    readonly idempotencyKey: string
    readonly uncertain: boolean
}
export const useDocumentRecoveryStore = defineStore('document-recovery', {
    state: (): { draft: DocumentDraft | null } => ({ draft: null }),
})
