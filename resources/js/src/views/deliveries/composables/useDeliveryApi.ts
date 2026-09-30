import { inject } from 'vue'
import { deliveriesApiKey } from '@/api/deliveries-api'
import type { DeliveriesApi } from '@/core/types/delivery'
export function useDeliveryApi(): DeliveriesApi {
    const api = inject(deliveriesApiKey)
    if (!api) throw new Error('Purchase delivery API is not configured')
    return api
}
