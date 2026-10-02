import { ApiError } from '@/core/types/api-error'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { AxiosInstance } from 'axios'
import type { PurchaseOrdersApi, PurchaseOrderWriteOptions } from '@/core/types/purchase-order'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import {
    parsePurchaseOrder,
    parsePurchaseOrderInput,
    parsePurchaseOrderUpdate,
    parsePurchaseOrderQuery,
    parsePurchaseOrderVersion,
    parsePurchaseOrderRejection,
} from '@/api/purchase-order-mapper'

const endpoint = '/api/v1/purchase-orders'
export function createHttpPurchaseOrders(
    client: AxiosInstance = createHttpClient(),
): PurchaseOrdersApi {
    const config = (options: PurchaseOrderWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    return {
        async list(query, signal) {
            return parsePage(
                (
                    await client.get<unknown>(endpoint, {
                        params: parsePurchaseOrderQuery(query),
                        signal,
                    })
                ).data,
                parsePurchaseOrder,
            )
        },
        async get(id, signal) {
            return parseDetail(
                (await client.get<unknown>(path(id), { signal })).data,
                parsePurchaseOrder,
            ).data
        },
        async create(input, options) {
            return parseDetail(
                (
                    await client.post<unknown>(
                        endpoint,
                        parsePurchaseOrderInput(input),
                        config(options),
                    )
                ).data,
                parsePurchaseOrder,
            ).data
        },
        async update(id, input, options) {
            return parseDetail(
                (
                    await client.put<unknown>(
                        path(id),
                        parsePurchaseOrderUpdate(input),
                        config(options),
                    )
                ).data,
                parsePurchaseOrder,
            ).data
        },
        async submit(id, input, options) {
            return parseDetail(
                (
                    await client.post<unknown>(
                        `${path(id)}/submit`,
                        parsePurchaseOrderVersion(input),
                        config(options),
                    )
                ).data,
                parsePurchaseOrder,
            ).data
        },
        async approve(id, input, options) {
            return parseReviewResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/approve`,
                        parsePurchaseOrderVersion(input),
                        config(options),
                    )
                ).data,
            )
        },
        async reject(id, input, options) {
            return parseReviewResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/reject`,
                        parsePurchaseOrderRejection(input),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}

function parseReviewResponse(value: unknown): PurchaseOrder {
    try {
        return parseDetail(value, parsePurchaseOrder).data
    } catch {
        throw new ApiError('unexpected')
    }
}
