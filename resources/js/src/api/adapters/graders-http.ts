import type { AxiosInstance } from 'axios'
import type { GradersApi } from '@/core/types/grader'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { normalizeApiError } from '@/services/api-error'
import { parseNumericId, parseObject } from '@/api/contracts/value-parsers'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
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
        async get(id, signal) {
            const response = await client.get<unknown>(
                `/api/v1/graders/${encodeURIComponent(id)}`,
                { signal },
            )
            return parseDetail(response.data, parseGraderRecord).data
        },
        create: unavailable,
        async update(id, input, options) {
            try {
                const response = await client.put<unknown>(
                    `/api/v1/graders/${encodeURIComponent(id)}`,
                    {
                        phone_number: input.phone,
                        grader_group: input.graderGroup,
                    },
                    { signal: options.signal },
                )
                const updated = parseDetail(response.data, (value) =>
                    parseNumericId(parseObject(value, 'grader').id),
                ).data
                if (updated !== id) throw new ApiError('unexpected')
            } catch (cause) {
                const failure = normalizeApiError(cause)
                const fields: Readonly<Record<string, string>> = {
                    phone_number: 'phone',
                    grader_group: 'graderGroup',
                }
                throw new ApiError(
                    failure.kind,
                    Object.fromEntries(
                        Object.entries(failure.fieldErrors).map(([field, messages]) => [
                            fields[field] ?? field,
                            messages,
                        ]),
                    ),
                    failure.code,
                    failure.requestId,
                )
            }
        },
        provision: unavailable,
        subscribe: () => () => undefined,
    }
}
