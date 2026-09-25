import { defineStore } from 'pinia'
import type { Buyer, BuyerInput } from '@/core/types/buyer'

export interface BuyerRecovery {
    readonly actorId: string
    readonly buyer?: Buyer
    readonly draft: BuyerInput
    readonly idempotencyKey: string
}
export const useBuyerRecoveryStore = defineStore('buyer-recovery', {
    state: (): { snapshot: BuyerRecovery | null } => ({ snapshot: null }),
})
