import { defineStore } from 'pinia'
import type { TimberProduct, TimberProductInput } from '@/core/types/timber-product'

export interface TimberProductRecovery {
    readonly actorId: string
    readonly timberProduct?: TimberProduct
    readonly draft: TimberProductInput
    readonly idempotencyKey: string
}
export const useTimberProductRecoveryStore = defineStore('timber-product-recovery', {
    state: (): { snapshot: TimberProductRecovery | null } => ({ snapshot: null }),
})
