import { defineStore } from 'pinia'
import type { Assignment, AssignmentInput } from '@/core/types/assignment'
export const useAssignmentRecoveryStore = defineStore('assignment-recovery', {
    state: (): {
        snapshot: {
            actorId: string
            assignment?: Assignment
            draft: AssignmentInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null }),
})
