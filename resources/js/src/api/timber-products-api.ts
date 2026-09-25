import type { InjectionKey } from 'vue'
import type { TimberProductsApi } from '@/core/types/timber-product'

export const timberProductsApiKey: InjectionKey<TimberProductsApi> = Symbol('timber-products-api')
