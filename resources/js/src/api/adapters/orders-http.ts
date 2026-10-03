import { ApiError } from '@/core/types/api-error'
import type { AxiosInstance } from 'axios'
import type { OrdersApi } from '@/core/types/order'
import { createHttpClient } from '@/services/http-client'
import { normalizeApiError } from '@/services/api-error'
import { parsePage, parseDetail } from '@/api/contracts/response-parsers'
import { parseOrderRecord, parseOrderDetail } from '@/api/order-mapper'
import { parseInteger, parseNumericId, parseObject } from '@/api/contracts/value-parsers'

export function createHttpOrders(client: AxiosInstance = createHttpClient()): OrdersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(query, signal) {
            const response = await client.get<unknown>('/api/v1/orders', {
                signal,
                params: {
                    page: parseInteger(query.page, 'page'),
                    search: query.search.trim() || undefined,
                },
            })
            return parsePage(response.data, parseOrderRecord)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(`/api/v1/orders/${encodeURIComponent(id)}`, {
                signal,
            })
            return parseDetail(response.data, parseOrderDetail).data
        },
        async create(input, options) {
            try {
                const response = await client.post<unknown>(
                    '/api/v1/orders',
                    {
                        pre_order_id: input.purchaseOrderId,
                        order_number: input.number.trim(),
                        order_date: input.orderDate,
                        mitra_id: input.mitraId,
                        grader_id: input.graderId,
                        grader_buyer_name: input.buyerGraderName.trim(),
                        grader_buyer_phone_number: input.buyerGraderPhone,
                        note: input.notes.trim() || null,
                    },
                    { signal: options.signal },
                )
                return {
                    id: parseDetail(response.data, (value) =>
                        parseNumericId(parseObject(value, 'order').id),
                    ).data,
                }
            } catch (cause) {
                const failure = normalizeApiError(cause)
                const fields: Readonly<Record<string, string>> = {
                    pre_order_id: 'purchaseOrderId',
                    order_number: 'number',
                    order_date: 'orderDate',
                    mitra_id: 'mitraId',
                    grader_id: 'graderId',
                    grader_buyer_name: 'buyerGraderName',
                    grader_buyer_phone_number: 'buyerGraderPhone',
                    note: 'notes',
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
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        subscribe: () => () => undefined,
    }
}
