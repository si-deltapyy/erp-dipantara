import { parsePaymentInput } from '@/api/contracts/payment-input'
import { parseWorkflowVersion } from '@/api/contracts/workflow-parsers'
import type { AxiosInstance } from 'axios'
import type { PaymentsApi, Payment } from '@/core/types/payment'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parsePayment, parsePaymentQuery } from '@/api/payment-mapper'
const endpoint = '/api/v1/payments'
export function createHttpPayments(client: AxiosInstance = createHttpClient()): PaymentsApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: WorkflowWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (await client.get<unknown>(endpoint, { params: parsePaymentQuery(query), signal }))
                    .data,
                parsePayment,
            )
        },
        async get(id, signal) {
            return parseDetail((await client.get<unknown>(path(id), { signal })).data, parsePayment)
                .data
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parsePaymentInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (
                    await client.put<unknown>(
                        path(id),
                        parsePaymentInput(input, true),
                        config(options),
                    )
                ).data,
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
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Payment {
    try {
        return parseDetail(value, parsePayment).data
    } catch {
        throw new ApiError('unexpected')
    }
}
