import type { AxiosInstance } from 'axios'
import type { DashboardApi } from '@/core/types/dashboard'
import { createHttpClient } from '@/services/http-client'
import { invalidContract } from '@/api/contracts/value-parsers'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseQueuePage, parseQueueQuery } from '@/api/dashboard-queue-mapper'
import { parseDashboardSnapshot, parseDashboardQuery } from '@/api/dashboard-mapper'
export function createHttpDashboard(client: AxiosInstance = createHttpClient()): DashboardApi {
    return {
        async queue(query, signal) {
            const response = await client.get<unknown>('/api/v1/dashboard/queue', {
                params: parseQueueQuery(query),
                signal,
            })
            return parseQueuePage(response.data, query.kind)
        },
        async get(signal, query) {
            const response = await client.get<unknown>('/api/v1/dashboard', {
                signal,
                ...(query ? { params: parseDashboardQuery(query) } : {}),
            })
            const snapshot = parseDetail(response.data, parseDashboardSnapshot).data
            if (query?.period && snapshot.grader && snapshot.grader.period !== query.period)
                return invalidContract('period')
            return snapshot
        },
        subscribe: () => () => undefined,
    }
}
