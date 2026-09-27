import type { InjectionKey } from 'vue'
import type { BuyersApi } from '@/core/types/buyer'

export const buyersApiKey: InjectionKey<BuyersApi> = Symbol('buyers-api')
