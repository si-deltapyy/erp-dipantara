import type { InjectionKey } from 'vue'
import type { DeliveriesApi } from '@/core/types/delivery'
export const deliveriesApiKey: InjectionKey<DeliveriesApi> = Symbol('deliveries-api')
