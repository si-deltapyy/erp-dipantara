import type { AxiosInstance } from 'axios'
import type { TimberProductsApi } from '@/core/types/timber-product'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'
import { parseTimberProductRecord } from '@/api/timber-product-mapper'

export function createHttpTimberProducts(
    client: AxiosInstance = createHttpClient(),
): TimberProductsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/products', { signal })
            return parseCollection(response.data, parseTimberProductRecord)
        },
        lookup: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
