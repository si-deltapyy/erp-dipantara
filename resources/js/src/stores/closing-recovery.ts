import { defineStore } from 'pinia'
import type { ClosingInput } from '@/core/types/closing'
export const useClosingRecoveryStore = defineStore('closing-recovery', {
    state: (): {
        snapshot: { actorId: string; draft: ClosingInput; idempotencyKey: string } | null
    } => ({ snapshot: null }),
})
