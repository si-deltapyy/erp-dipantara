import type { AxiosInstance } from 'axios'
import type { GradingsApi } from '@/core/types/grading'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseGradingRecord } from '@/api/grading-mapper'
import { mapApiFieldErrors } from '@/services/api-error'
import { parseObject, parseNumericId } from '@/api/contracts/value-parsers'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'

export function createHttpGradings(client: AxiosInstance = createHttpClient()): GradingsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/gradings', { signal })
            return parseCollection(response.data, parseGradingRecord)
        },
        get: unavailable,
        async create(input, options) {
            try {
                const response = await client.post<unknown>(
                    '/api/v1/gradings',
                    {
                        pre_order_id: input.purchaseOrderId,
                        mitra_id: input.mitraId,
                        grader_id: input.graderId,
                        product_id: input.productId,
                        grading_date: input.gradingDate,
                        note: input.notes.trim() || null,
                    },
                    { signal: options.signal },
                )
                return {
                    id: parseDetail(response.data, (value) =>
                        parseNumericId(parseObject(value, 'grading').id),
                    ).data,
                }
            } catch (cause) {
                const fields: Readonly<Record<string, string>> = {
                    pre_order_id: 'purchaseOrderId',
                    mitra_id: 'mitraId',
                    grader_id: 'graderId',
                    product_id: 'productId',
                    grading_date: 'gradingDate',
                    note: 'notes',
                }
                throw mapApiFieldErrors(cause, fields)
            }
        },
        update: unavailable,
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        revise: unavailable,
        subscribe: () => () => undefined,
    }
}
