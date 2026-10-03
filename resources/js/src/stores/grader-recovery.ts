import { defineStore } from 'pinia'
import type { Grader, GraderRecord, GraderContactInput } from '@/core/types/grader'

export interface GraderRecovery {
    readonly actorId: string
    readonly grader?: GraderRecord
    readonly draft: GraderContactInput
    readonly idempotencyKey: string
}
export const useGraderRecoveryStore = defineStore('grader-recovery', {
    state: (): { snapshot: GraderRecovery | null; provision: GraderProvisionRecovery | null } => ({
        snapshot: null,
        provision: null,
    }),
})

export interface GraderProvisionRecovery {
    readonly actorId: string
    readonly grader: Grader
    readonly idempotencyKey: string
}
