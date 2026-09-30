import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { reportsApiKey } from '@/api/reports-api'
import { useMasterList } from '@/composables/useMasterList'
import type { ProductionRow } from '@/core/types/production'
import { reportRouteQuery } from './report-route-query'
export function useProductionReport(): ReturnType<typeof useMasterList<ProductionRow>> {
    const api = inject(reportsApiKey)
    if (!api) throw new Error('Reports API is not configured')
    const route = useRoute()
    return useMasterList(
        {
            list: (query, signal) =>
                api.production({ ...query, ...reportRouteQuery(route.query) }, signal),
            subscribe: api.subscribe,
        },
        'reports',
        () => ({ ...reportRouteQuery(route.query) }),
    )
}
