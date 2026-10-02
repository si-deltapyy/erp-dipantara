import type { AxiosInstance } from 'axios'
import type { GradingsApi } from '@/core/types/grading'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'

export function createHttpGradings(client: AxiosInstance = createHttpClient()): GradingsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/gradings', { signal })
            return parseCollection(response.data, () => {
                throw new ApiError('unexpected', {}, 'record.unconfirmed')
            })
        },
        get: unavailable,
        create: unavailable,
        update: unavailable,
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        revise: unavailable,
        subscribe: () => () => undefined,
    }
}
