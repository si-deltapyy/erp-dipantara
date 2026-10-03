import { ApiError } from '@/core/types/api-error'
import type { AxiosInstance } from 'axios'
import type { OrdersApi } from '@/core/types/order'
import { createHttpClient } from '@/services/http-client'
import { parsePage } from '@/api/contracts/response-parsers'
import { parseOrderRecord } from '@/api/order-mapper'
import { parseInteger } from '@/api/contracts/value-parsers'

export function createHttpOrders(client: AxiosInstance = createHttpClient()): OrdersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(query, signal) {
            const response = await client.get<unknown>('/api/v1/orders', {
                signal,
                params: {
                    page: parseInteger(query.page, 'page'),
                    search: query.search.trim() || undefined,
                },
            })
            return parsePage(response.data, parseOrderRecord)
        },
        get: unavailable,
        create: unavailable,
        update: unavailable,
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        subscribe: () => () => undefined,
    }
}
