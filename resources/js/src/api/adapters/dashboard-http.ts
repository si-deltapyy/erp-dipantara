import type { AxiosInstance } from 'axios'
import type { DashboardApi } from '@/core/types/dashboard'
import { createHttpClient } from '@/services/http-client'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseDashboardSnapshot } from '@/api/dashboard-mapper'
export function createHttpDashboard(client: AxiosInstance = createHttpClient()): DashboardApi {
    return {
        async get(signal) {
            const response = await client.get<unknown>('/api/v1/dashboard', { signal })
            return parseDetail(response.data, parseDashboardSnapshot).data
        },
        subscribe: () => () => undefined,
    }
}
