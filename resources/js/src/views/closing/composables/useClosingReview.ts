import type { Ref } from 'vue'
import type { Closing } from '@/core/types/closing'
import { useRecordReview } from '@/composables/useRecordReview'
import { useClosingRecoveryStore } from '@/stores/closing-recovery'
import { canReviewClosing } from '@/core/domain/closing-policy'
import { useClosingApi } from './useClosingApi'
export function useClosingReview(
    closing: Ref<Closing | undefined>,
    refresh: () => Promise<void>,
    id: () => unknown,
): ReturnType<typeof useRecordReview<Closing>> {
    return useRecordReview(closing, refresh, id, {
        resource: 'closings',
        api: useClosingApi(),
        canAct: canReviewClosing,
        recovery: useClosingRecoveryStore(),
    })
}
