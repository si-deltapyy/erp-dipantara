import type { AxiosInstance } from 'axios'
import type { DashboardApi } from '@/core/types/dashboard'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseDashboardSnapshot } from '@/api/dashboard-mapper'

export function createHttpDashboard(client: AxiosInstance = createHttpClient()): DashboardApi {
    return {
        async queue() {
            throw new ApiError('unexpected', {}, 'feature.unavailable')
        },
        async get(signal) {
            const response = await client.get<unknown>('/api/v1/dashboard', { signal })
            return parseDetail(response.data, parseDashboardSnapshot).data
        },
        subscribe: () => () => undefined,
    }
}
