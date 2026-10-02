import type { ReviewSnapshot } from '@/core/types/workflow'
import { defineStore } from 'pinia'
import type { Grading, GradingInput, GradingRevisionInput } from '@/core/types/grading'
export const useGradingRecoveryStore = defineStore('grading-recovery', {
    state: (): {
        revision: {
            actorId: string
            parent: Grading
            draft: Omit<GradingRevisionInput, 'version'>
            idempotencyKey: string
        } | null
        review: ReviewSnapshot<Grading> | null
        submission: { actorId: string; record: Grading; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            grading?: Grading
            draft: GradingInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, review: null, submission: null, revision: null }),
})
