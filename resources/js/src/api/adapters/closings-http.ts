import type { ClosingsApi } from '@/core/types/closing'
import { ApiError } from '@/core/types/api-error'

export function createHttpClosings(): ClosingsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        list: unavailable,
        get: unavailable,
        create: unavailable,
        eligibility: unavailable,
        approve: unavailable,
        reject: unavailable,
        subscribe: () => () => undefined,
    }
}
