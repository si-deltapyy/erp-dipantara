import { defineStore } from 'pinia'
import type { Mitra, MitraInput } from '@/core/types/mitra'

export interface MitraRecovery {
    readonly actorId: string
    readonly mitra?: Mitra
    readonly draft: MitraInput
    readonly idempotencyKey: string
}
export const useMitraRecoveryStore = defineStore('mitra-recovery', {
    state: (): { snapshot: MitraRecovery | null } => ({ snapshot: null }),
})
