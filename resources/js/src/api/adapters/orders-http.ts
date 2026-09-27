import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import type { AxiosInstance } from 'axios'
import type { Order, OrdersApi, OrderWriteOptions } from '@/core/types/order'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseOrder, parseOrderInput, parseOrderQuery } from '@/api/order-mapper'
const endpoint = '/api/v1/orders'
export function createHttpOrders(client: AxiosInstance = createHttpClient()): OrdersApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: OrderWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (await client.get<unknown>(endpoint, { params: parseOrderQuery(query), signal }))
                    .data,
                parseOrder,
            )
        },
        async get(id, signal) {
            return parseDetail((await client.get<unknown>(path(id), { signal })).data, parseOrder)
                .data
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parseOrderInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (await client.put<unknown>(path(id), parseOrderInput(input, true), config(options)))
                    .data,
            )
        },
        async submit(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/submit`,
                        parseWorkflowVersion(input),
                        config(options),
                    )
                ).data,
            )
        },
        async approve(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/approve`,
                        parseWorkflowVersion(input),
                        config(options),
                    )
                ).data,
            )
        },
        async reject(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/reject`,
                        parseWorkflowRejection(input),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Order {
    try {
        return parseDetail(value, parseOrder).data
    } catch {
        throw new ApiError('unexpected')
    }
}
