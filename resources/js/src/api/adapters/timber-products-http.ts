import type { AxiosInstance } from 'axios'
import type { TimberProductsApi } from '@/core/types/timber-product'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { normalizeApiError } from '@/services/api-error'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
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
        async create(input, options) {
            try {
                const response = await client.post<unknown>(
                    '/api/v1/products',
                    {
                        name: input.name.trim(),
                        type: input.type.trim(),
                        grade: input.grade.trim(),
                        dimension_length: input.dimensionLength,
                        dimension_width: input.dimensionWidth,
                        dimension_height: input.dimensionHeight,
                        dimension_diameter: input.dimensionDiameter,
                        volume: input.volume.trim() || null,
                        price: input.price,
                    },
                    { signal: options.signal },
                )
                return parseDetail(response.data, parseTimberProductRecord).data
            } catch (cause) {
                const failure = normalizeApiError(cause)
                const fields: Readonly<Record<string, string>> = {
                    dimension_length: 'dimensionLength',
                    dimension_width: 'dimensionWidth',
                    dimension_height: 'dimensionHeight',
                    dimension_diameter: 'dimensionDiameter',
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
