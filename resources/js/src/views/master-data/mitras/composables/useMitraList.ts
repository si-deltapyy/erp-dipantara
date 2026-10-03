import { inject } from 'vue'
import { mitrasApiKey } from '@/api/mitras-api'
import { useMasterList } from '@/composables/useMasterList'
import type { MitraRecord } from '@/core/types/mitra'

export function useMitraList(): ReturnType<typeof useMasterList<MitraRecord>> & {
    searchMitras(): Promise<void>
} {
    const api = inject(mitrasApiKey)
    if (!api) throw new Error('Mitras API is not configured')
    const list = useMasterList(api, 'mitras', undefined, {
        searchText: (mitra) =>
            [mitra.name, mitra.phone, mitra.address, mitra.graderGroup].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    return { ...list, searchMitras: list.searchRecords }
}
