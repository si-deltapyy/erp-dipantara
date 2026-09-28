import type { AxiosInstance } from 'axios'
import type { DashboardApi } from '@/core/types/dashboard'
import { createHttpClient } from '@/services/http-client'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseQueuePage, parseQueueQuery } from '@/api/dashboard-queue-mapper'
import { parseDashboardSnapshot } from '@/api/dashboard-mapper'
export function createHttpDashboard(client: AxiosInstance = createHttpClient()): DashboardApi {
    return {
        async queue(query, signal) {
            const response = await client.get<unknown>('/api/v1/dashboard/queue', {
                params: parseQueueQuery(query),
                signal,
            })
            return parseQueuePage(response.data, query.kind)
        },
        async get(signal) {
            const response = await client.get<unknown>('/api/v1/dashboard', { signal })
            return parseDetail(response.data, parseDashboardSnapshot).data
        },
        subscribe: () => () => undefined,
    }
}
