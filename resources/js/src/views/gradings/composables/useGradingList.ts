import { useMasterList } from '@/composables/useMasterList'
import { useGradingApi } from './useGradingApi'
import type { GradingRecord } from '@/core/types/grading'
export function useGradingList(): ReturnType<typeof useMasterList<GradingRecord>> {
    return useMasterList(
        useGradingApi(),
        'gradings',
        undefined,
        {
            searchText: (grading) =>
                [
                    grading.purchaseOrderNumber,
                    grading.mitraName,
                    grading.graderGroup,
                    grading.productName,
                ].join(' '),
            compare: (left, right) =>
                left.gradingDate.localeCompare(right.gradingDate) ||
                left.id.localeCompare(right.id),
        },
        'gradings.read.all',
    )
}
