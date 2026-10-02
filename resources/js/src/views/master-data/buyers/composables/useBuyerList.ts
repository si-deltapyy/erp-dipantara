import { inject } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import { useMasterList } from '@/composables/useMasterList'
import type { BuyerRecord } from '@/core/types/buyer'

export function useBuyerList(): ReturnType<typeof useMasterList<BuyerRecord>> & {
    searchBuyers(): Promise<void>
} {
    const api = inject(buyersApiKey)
    if (!api) throw new Error('Buyers API is not configured')
    const list = useMasterList(api, 'buyers', undefined, {
        searchText: (buyer) =>
            [buyer.companyName, buyer.contactName, buyer.phone, buyer.address].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    return { ...list, searchBuyers: list.searchRecords }
}
