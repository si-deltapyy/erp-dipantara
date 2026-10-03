import { useRecordDetail } from '@/composables/useRecordDetail'
import { useGradingApi } from './useGradingApi'
import type { Grading } from '@/core/types/grading'

export function useGradingList(): ReturnType<typeof useRecordDetail<readonly Grading[]>> {
    const api = useGradingApi()
    return useRecordDetail(
        {
            get: (_id, signal) =>
                api.list({ page: 1, perPage: 20, search: '', sort: '-createdAt' }, signal),
            subscribe: api.subscribe,
        },
        'gradings',
        true,
        () => 'gradings',
    )
}
