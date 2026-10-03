import type { AxiosInstance } from 'axios'
import type { DeliveriesApi } from '@/core/types/delivery'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDeliveryRecord } from '@/api/delivery-mapper'
import { parseCollection } from '@/api/contracts/response-parsers'

export function createHttpDeliveries(client: AxiosInstance = createHttpClient()): DeliveriesApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/logs-deliveries', { signal })
            return parseCollection(response.data, parseDeliveryRecord)
        },
        get: unavailable,
        create: unavailable,
        update: unavailable,
        availability: unavailable,
        dispatch: unavailable,
        receive: unavailable,
        subscribe: () => () => undefined,
    }
}
