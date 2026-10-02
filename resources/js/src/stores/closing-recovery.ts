import type { ReviewSnapshot } from '@/core/types/workflow'
import { defineStore } from 'pinia'
import type { ClosingInput, Closing } from '@/core/types/closing'
export const useClosingRecoveryStore = defineStore('closing-recovery', {
    state: (): {
        review: ReviewSnapshot<Closing> | null
        snapshot: { actorId: string; draft: ClosingInput; idempotencyKey: string } | null
    } => ({ snapshot: null, review: null }),
})
