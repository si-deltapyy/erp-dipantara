import { defineStore } from 'pinia'
import type { MitraRecord, MitraInput } from '@/core/types/mitra'

export interface MitraRecovery {
    readonly actorId: string
    readonly mitra?: MitraRecord
    readonly draft: MitraInput
    readonly idempotencyKey: string
}
export const useMitraRecoveryStore = defineStore('mitra-recovery', {
    state: (): { snapshot: MitraRecovery | null } => ({ snapshot: null }),
})
