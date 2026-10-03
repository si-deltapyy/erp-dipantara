import { defineStore } from 'pinia'
import type { TimberProductCreateInput } from '@/core/types/timber-product'

export interface TimberProductRecovery {
    readonly actorId: string
    readonly draft: TimberProductCreateInput
    readonly idempotencyKey: string
}
export const useTimberProductRecoveryStore = defineStore('timber-product-recovery', {
    state: (): { snapshot: TimberProductRecovery | null } => ({ snapshot: null }),
})
