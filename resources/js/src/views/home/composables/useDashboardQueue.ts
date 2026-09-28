import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { dashboardApiKey } from '@/api/dashboard-api'
import { parseQueueKind } from '@/api/dashboard-queue-mapper'
import { useMasterList } from '@/composables/useMasterList'
import type { DashboardQueueEntry } from '@/core/types/dashboard-queue'
export function useDashboardQueue(): ReturnType<typeof useMasterList<DashboardQueueEntry>> {
    const api = inject(dashboardApiKey)
    if (!api) throw new Error('Dashboard API is not configured')
    const route = useRoute()
    return useMasterList(
        {
            list: async (query, signal) =>
                api.queue({ ...query, kind: parseQueueKind(route.query.kind) }, signal),
            subscribe: api.subscribe,
        },
        'dashboard',
        () => ({ kind: typeof route.query.kind === 'string' ? route.query.kind : undefined }),
    )
}
