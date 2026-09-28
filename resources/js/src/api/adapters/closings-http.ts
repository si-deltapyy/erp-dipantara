import type {
    ReviewAction,
    WorkflowVersion,
    WorkflowRejection,
    WorkflowWriteOptions,
} from '@/core/types/workflow'
import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import type { Closing } from '@/core/types/closing'
import { ApiError } from '@/core/types/api-error'
import { parseClosing } from '@/api/closing-record-mapper'
import { parseClosingInput, parseClosingQuery } from '@/api/contracts/closing-input'
import type { AxiosInstance } from 'axios'
import type { ClosingsApi } from '@/core/types/closing'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseClosingEligibility } from '@/api/closing-mapper'
export function createHttpClosings(client: AxiosInstance = createHttpClient()): ClosingsApi {
    async function review(
        action: ReviewAction,
        id: string,
        input: WorkflowVersion | WorkflowRejection,
        options: WorkflowWriteOptions,
    ): Promise<Closing> {
        const payload =
            action === 'reject' ? parseWorkflowRejection(input) : parseWorkflowVersion(input)
        const response = await client.post<unknown>(
            `/api/v1/closings/${encodeURIComponent(parseId(id))}/${action}`,
            payload,
            { signal: options.signal, headers: { 'Idempotency-Key': options.idempotencyKey } },
        )
        return parseClosingMutation(response.data)
    }
    return {
        approve: (id, input, options) => review('approve', id, input, options),
        reject: (id, input, options) => review('reject', id, input, options),
        async list(query, signal) {
            return parsePage(
                (
                    await client.get<unknown>('/api/v1/closings', {
                        params: parseClosingQuery(query),
                        signal,
                    })
                ).data,
                parseClosing,
            )
        },
        async get(id, signal) {
            return parseDetail(
                (
                    await client.get<unknown>(
                        `/api/v1/closings/${encodeURIComponent(parseId(id))}`,
                        { signal },
                    )
                ).data,
                parseClosing,
            ).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                '/api/v1/closings',
                parseClosingInput(input),
                {
                    signal: options.signal,
                    headers: { 'Idempotency-Key': options.idempotencyKey },
                },
            )
            return parseClosingMutation(response.data)
        },
        async eligibility(id, signal) {
            return parseDetail(
                (
                    await client.get<unknown>(
                        `/api/v1/purchase-orders/${encodeURIComponent(parseId(id))}/closing-eligibility`,
                        { signal },
                    )
                ).data,
                parseClosingEligibility,
            ).data
        },
        subscribe: () => () => undefined,
    }
}

function parseClosingMutation(value: unknown): Closing {
    try {
        return parseDetail(value, parseClosing).data
    } catch {
        throw new ApiError('unexpected')
    }
}
