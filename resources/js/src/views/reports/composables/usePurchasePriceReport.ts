import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { reportsApiKey } from '@/api/reports-api'
import { useMasterList } from '@/composables/useMasterList'
import type { PurchasePriceRow } from '@/core/types/purchase-price-report'
import { reportRouteQuery } from './report-route-query'
export function usePurchasePriceReport(): ReturnType<typeof useMasterList<PurchasePriceRow>> {
    const api = inject(reportsApiKey)
    if (!api) throw new Error('Reports API is not configured')
    const route = useRoute()
    return useMasterList(
        {
            list: (query, signal) =>
                api.purchasePrices({ ...query, ...reportRouteQuery(route.query) }, signal),
            subscribe: api.subscribe,
        },
        'reports',
        () => ({ ...reportRouteQuery(route.query) }),
    )
}
