import type { AxiosInstance } from 'axios'
import type { DeliveriesApi, Delivery } from '@/core/types/delivery'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import {
    parseAvailableTimber,
    parseAvailabilityQuery,
    parseDelivery,
    parseDeliveryInput,
    parseDeliveryQuery,
} from '@/api/delivery-mapper'
const endpoint = '/api/v1/deliveries'
export function createHttpDeliveries(client: AxiosInstance = createHttpClient()): DeliveriesApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: WorkflowWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (await client.get<unknown>(endpoint, { params: parseDeliveryQuery(query), signal }))
                    .data,
                parseDelivery,
            )
        },
        async get(id, signal) {
            return parseDetail(
                (await client.get<unknown>(path(id), { signal })).data,
                parseDelivery,
            ).data
        },
        async availability(query, signal) {
            return parsePage(
                (
                    await client.get<unknown>(`${endpoint}/availability`, {
                        params: parseAvailabilityQuery(query),
                        signal,
                    })
                ).data,
                parseAvailableTimber,
            )
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parseDeliveryInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (
                    await client.put<unknown>(
                        path(id),
                        parseDeliveryInput(input, true),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Delivery {
    try {
        return parseDetail(value, parseDelivery).data
    } catch {
        throw new ApiError('unexpected')
    }
}
