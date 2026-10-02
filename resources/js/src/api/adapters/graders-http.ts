import type { AxiosInstance } from 'axios'
import type { GradersApi } from '@/core/types/grader'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'
import { parseGraderRecord } from '@/api/grader-mapper'

export function createHttpGraders(client: AxiosInstance = createHttpClient()): GradersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/graders', { signal })
            return parseCollection(response.data, parseGraderRecord)
        },
        lookup: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        provision: unavailable,
        subscribe: () => () => undefined,
    }
}
