import type { AxiosInstance } from 'axios'
import type { MitrasApi } from '@/core/types/mitra'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'
import { parseMitraRecord } from '@/api/mitra-mapper'

export function createHttpMitras(client: AxiosInstance = createHttpClient()): MitrasApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/mitras', { signal })
            return parseCollection(response.data, parseMitraRecord)
        },
        lookup: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
