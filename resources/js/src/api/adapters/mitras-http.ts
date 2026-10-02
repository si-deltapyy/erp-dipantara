import type { AxiosInstance } from 'axios'
import type { MitrasApi } from '@/core/types/mitra'
import { ApiError } from '@/core/types/api-error'
import { normalizeApiError } from '@/services/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
import { parseMitraRecord, parseMitraInput } from '@/api/mitra-mapper'

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
        async create(input, options) {
            const mitra = parseMitraInput(input)
            try {
                const response = await client.post<unknown>(
                    '/api/v1/mitras',
                    {
                        name: mitra.name,
                        phone_number: mitra.phone,
                        address: mitra.address,
                        grader_group: mitra.graderGroup,
                    },
                    { signal: options.signal },
                )
                return parseDetail(response.data, parseMitraRecord).data
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
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
