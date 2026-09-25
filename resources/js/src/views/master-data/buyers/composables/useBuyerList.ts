import { inject } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import { useMasterList } from '@/composables/useMasterList'
import type { Buyer } from '@/core/types/buyer'

export function useBuyerList(): ReturnType<typeof useMasterList<Buyer>> & {
    searchBuyers(): Promise<void>
} {
    const api = inject(buyersApiKey)
    if (!api) throw new Error('Buyers API is not configured')
    const list = useMasterList(api, 'buyers')
    return { ...list, searchBuyers: list.searchRecords }
}
