import { inject, ref } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useMasterList } from '@/composables/useMasterList'
import type { BuyerRecord } from '@/core/types/buyer'

export function useBuyerList(): ReturnType<typeof useMasterList<BuyerRecord>> & {
    searchBuyers(): Promise<void>
    selectedId: ReturnType<typeof ref<string | undefined>>
    detail: ReturnType<typeof useRecordDetail<BuyerRecord>>
} {
    const api = inject(buyersApiKey)
    if (!api) throw new Error('Buyers API is not configured')
    const list = useMasterList(api, 'buyers', undefined, {
        searchText: (buyer) =>
            [buyer.companyName, buyer.contactName, buyer.phone, buyer.address].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    const selectedId = ref<string>()
    const detail = useRecordDetail(api, 'buyers', false, () => selectedId.value)
    return { ...list, selectedId, detail, searchBuyers: list.searchRecords }
}
