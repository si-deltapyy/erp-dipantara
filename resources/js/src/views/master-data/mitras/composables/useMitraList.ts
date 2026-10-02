import { inject } from 'vue'
import { mitrasApiKey } from '@/api/mitras-api'
import { useMasterList } from '@/composables/useMasterList'
import type { Mitra } from '@/core/types/mitra'

export function useMitraList(): ReturnType<typeof useMasterList<Mitra>> & {
    searchMitras(): Promise<void>
} {
    const api = inject(mitrasApiKey)
    if (!api) throw new Error('Mitras API is not configured')
    const list = useMasterList(api, 'mitras')
    return { ...list, searchMitras: list.searchRecords }
}
