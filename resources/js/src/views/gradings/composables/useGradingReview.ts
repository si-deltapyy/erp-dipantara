import type { Ref } from 'vue'
import type { Grading } from '@/core/types/grading'
import { useRecordReview } from '@/composables/useRecordReview'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { useGradingApi } from './useGradingApi'
export function useGradingReview(
    grading: Ref<Grading | undefined>,
    refresh: () => Promise<void>,
    id: () => unknown,
): ReturnType<typeof useRecordReview<Grading>> {
    return useRecordReview(grading, refresh, id, {
        resource: 'gradings',
        api: useGradingApi(),
        canAct: canActOnGrading,
        recovery: useGradingRecoveryStore(),
    })
}
