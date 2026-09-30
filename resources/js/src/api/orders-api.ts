import type { InjectionKey } from 'vue'
import type { OrdersApi } from '@/core/types/order'
export const ordersApiKey: InjectionKey<OrdersApi> = Symbol('orders-api')
