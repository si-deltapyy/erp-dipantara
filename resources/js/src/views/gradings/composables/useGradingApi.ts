import { inject } from 'vue'
import { gradingsApiKey } from '@/api/gradings-api'
import type { GradingsApi } from '@/core/types/grading'
export function useGradingApi(): GradingsApi {
    const api = inject(gradingsApiKey)
    if (!api) throw new Error('Purchase grading API is not configured')
    return api
}
