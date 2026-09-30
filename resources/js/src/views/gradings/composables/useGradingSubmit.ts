import type { Ref } from 'vue'
import type { Grading } from '@/core/types/grading'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { useGradingApi } from './useGradingApi'
export function useGradingSubmit(
    grading: Ref<Grading | undefined>,
): ReturnType<typeof useRecordSubmit<Grading>> {
    const recovery = useGradingRecoveryStore()
    return useRecordSubmit(grading, {
        resource: 'gradings',
        api: useGradingApi(),
        canAct: canActOnGrading,
        snapshot: () => recovery.submission,
        recover: (record, idempotencyKey, actorId) => {
            recovery.submission = { record, idempotencyKey, actorId }
        },
        clear: () => {
            recovery.submission = null
        },
    })
}
