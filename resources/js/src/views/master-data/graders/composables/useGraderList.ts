import { inject } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import { useMasterList } from '@/composables/useMasterList'
import type { Grader } from '@/core/types/grader'

export function useGraderList(): ReturnType<typeof useMasterList<Grader>> & {
    searchGraders(): Promise<void>
} {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const list = useMasterList(api, 'graders')
    return { ...list, searchGraders: list.searchRecords }
}
