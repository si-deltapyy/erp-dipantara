import { inject, ref } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useMasterList } from '@/composables/useMasterList'
import type { GraderRecord } from '@/core/types/grader'

export function useGraderList(): ReturnType<typeof useMasterList<GraderRecord>> & {
    searchGraders(): Promise<void>
    selectedId: ReturnType<typeof ref<string | undefined>>
    detail: ReturnType<typeof useRecordDetail<GraderRecord>>
} {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const list = useMasterList(api, 'graders', undefined, {
        searchText: (grader) => [grader.name, grader.phone, grader.graderGroup].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    const selectedId = ref<string>()
    const detail = useRecordDetail(api, 'graders', false, () => selectedId.value)
    return { ...list, selectedId, detail, searchGraders: list.searchRecords }
}
