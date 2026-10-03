import { ApiError } from '@/core/types/api-error'
import type { AxiosInstance } from 'axios'
import type {
    PurchaseOrdersApi,
    PurchaseOrderWriteInput,
    PurchaseOrderWriteOptions,
} from '@/core/types/purchase-order'
import { createHttpClient } from '@/services/http-client'
import { mapApiFieldErrors } from '@/services/api-error'
import { parsePage, parseDetail } from '@/api/contracts/response-parsers'
import { parsePurchaseOrderRecord, parsePurchaseOrderDetail } from '@/api/purchase-order-mapper'
import { parseInteger, parseNumericId, parseObject } from '@/api/contracts/value-parsers'

export function createHttpPurchaseOrders(
    client: AxiosInstance = createHttpClient(),
): PurchaseOrdersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    async function write(
        input: PurchaseOrderWriteInput,
        options: PurchaseOrderWriteOptions,
        id?: string,
    ): Promise<{ readonly id: string }> {
        try {
            const response = await client.request<unknown>({
                method: id ? 'put' : 'post',
                url: id ? `/api/v1/pre-orders/${encodeURIComponent(id)}` : '/api/v1/pre-orders',
                signal: options.signal,
                data: {
                    buyer_id: input.buyerId,
                    product_id: input.productId,
                    pre_order_number: input.number.trim(),
                    pre_order_date: input.orderDate,
                    pre_order_closing_date: input.closingDate,
                    quantity: input.quantity,
                    total_price: input.totalAmount.trim() || null,
                    note: input.notes.trim() || null,
                    ...(id ? {} : { pre_order_status: 'pending' }),
                },
            })
            return {
                id: parseDetail(response.data, (value) =>
                    parseNumericId(parseObject(value, 'purchaseOrder').id),
                ).data,
            }
        } catch (cause) {
            const fields: Readonly<Record<string, string>> = {
                buyer_id: 'buyerId',
                product_id: 'productId',
                pre_order_number: 'number',
                pre_order_date: 'orderDate',
                pre_order_closing_date: 'closingDate',
                total_price: 'totalAmount',
                note: 'notes',
            }
            throw mapApiFieldErrors(cause, fields)
        }
    }
    return {
        async list(query, signal) {
            const response = await client.get<unknown>('/api/v1/pre-orders', {
                signal,
                params: {
                    page: parseInteger(query.page, 'page'),
                    search: query.search.trim() || undefined,
                },
            })
            return parsePage(response.data, parsePurchaseOrderRecord)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `/api/v1/pre-orders/${encodeURIComponent(id)}`,
                { signal },
            )
            return parseDetail(response.data, parsePurchaseOrderDetail).data
        },
        create: (input, options) => write(input, options),
        update: (id, input, options) => write(input, options, id),
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        subscribe: () => () => undefined,
    }
}
