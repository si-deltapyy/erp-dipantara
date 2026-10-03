import { defineStore } from 'pinia'
import type { BuyerRecord, BuyerInput } from '@/core/types/buyer'

export interface BuyerRecovery {
    readonly actorId: string
    readonly buyer?: BuyerRecord
    readonly draft: BuyerInput
    readonly idempotencyKey: string
}
export const useBuyerRecoveryStore = defineStore('buyer-recovery', {
    state: (): { snapshot: BuyerRecovery | null } => ({ snapshot: null }),
})
