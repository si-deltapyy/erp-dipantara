import { inject } from 'vue'
import { purchaseOrdersApiKey } from '@/api/purchase-orders-api'
import type { PurchaseOrdersApi } from '@/core/types/purchase-order'
export function usePurchaseOrderApi(): PurchaseOrdersApi {
    const api = inject(purchaseOrdersApiKey)
    if (!api) throw new Error('Purchase order API is not configured')
    return api
}
