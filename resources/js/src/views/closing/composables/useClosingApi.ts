import { inject } from 'vue'
import { closingsApiKey } from '@/api/closings-api'
import type { ClosingsApi } from '@/core/types/closing'
export function useClosingApi(): ClosingsApi {
    const api = inject(closingsApiKey)
    if (!api) throw new Error('Closing API is not configured')
    return api
}
