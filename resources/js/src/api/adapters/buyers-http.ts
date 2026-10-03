import type { AxiosInstance } from 'axios'
import type { BuyersApi } from '@/core/types/buyer'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'
import { parseBuyerRecord } from '@/api/buyer-mapper'

export function createHttpBuyers(client: AxiosInstance = createHttpClient()): BuyersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/buyers', { signal })
            return parseCollection(response.data, parseBuyerRecord)
        },
        lookup: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
