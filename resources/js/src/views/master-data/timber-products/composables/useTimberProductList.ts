import { inject } from 'vue'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { useMasterList } from '@/composables/useMasterList'
import type { TimberProduct } from '@/core/types/timber-product'

export function useTimberProductList(): ReturnType<typeof useMasterList<TimberProduct>> & {
    searchTimberProducts(): Promise<void>
} {
    const api = inject(timberProductsApiKey)
    if (!api) throw new Error('TimberProducts API is not configured')
    const list = useMasterList(api, 'timber-products')
    return { ...list, searchTimberProducts: list.searchRecords }
}
