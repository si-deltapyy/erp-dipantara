import { inject } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import { useMasterList } from '@/composables/useMasterList'
import type { GraderRecord } from '@/core/types/grader'

export function useGraderList(): ReturnType<typeof useMasterList<GraderRecord>> & {
    searchGraders(): Promise<void>
} {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const list = useMasterList(api, 'graders', undefined, {
        searchText: (grader) => [grader.name, grader.phone, grader.graderGroup].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    return { ...list, searchGraders: list.searchRecords }
}
