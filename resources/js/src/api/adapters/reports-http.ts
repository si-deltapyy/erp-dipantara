import type { ReportsApi } from '@/core/types/report'
import { ApiError } from '@/core/types/api-error'

export function createHttpReports(): ReportsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        export: unavailable,
        purchasePrices: unavailable,
        production: unavailable,
        subscribe: () => () => undefined,
    }
}
