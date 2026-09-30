import type { InjectionKey } from 'vue'
import type { PurchaseOrdersApi } from '@/core/types/purchase-order'
export const purchaseOrdersApiKey: InjectionKey<PurchaseOrdersApi> = Symbol('purchase-orders-api')
