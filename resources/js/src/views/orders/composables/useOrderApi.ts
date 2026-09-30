import { inject } from 'vue'
import { ordersApiKey } from '@/api/orders-api'
import type { OrdersApi } from '@/core/types/order'
export function useOrderApi(): OrdersApi {
    const api = inject(ordersApiKey)
    if (!api) throw new Error('Purchase order API is not configured')
    return api
}
