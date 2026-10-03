import { inject } from 'vue'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { useMasterList } from '@/composables/useMasterList'
import type { TimberProductRecord } from '@/core/types/timber-product'

export function useTimberProductList(): ReturnType<typeof useMasterList<TimberProductRecord>> & {
    searchTimberProducts(): Promise<void>
} {
    const api = inject(timberProductsApiKey)
    if (!api) throw new Error('TimberProducts API is not configured')
    const list = useMasterList(api, 'timber-products', undefined, {
        searchText: (product) => [product.name, product.type, product.grade].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    return { ...list, searchTimberProducts: list.searchRecords }
}
