import { parseGradingRevision } from '@/api/contracts/grading-revision'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import type { AxiosInstance } from 'axios'
import type { Grading, GradingsApi } from '@/core/types/grading'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseGrading, parseGradingInput, parseGradingQuery } from '@/api/grading-mapper'
const endpoint = '/api/v1/gradings'
export function createHttpGradings(client: AxiosInstance = createHttpClient()): GradingsApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: WorkflowWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (await client.get<unknown>(endpoint, { params: parseGradingQuery(query), signal }))
                    .data,
                parseGrading,
            )
        },
        async get(id, signal) {
            return parseDetail((await client.get<unknown>(path(id), { signal })).data, parseGrading)
                .data
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parseGradingInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (
                    await client.put<unknown>(
                        path(id),
                        parseGradingInput(input, true),
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
        async revise(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/revisions`,
                        parseGradingRevision(input),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Grading {
    try {
        return parseDetail(value, parseGrading).data
    } catch {
        throw new ApiError('unexpected')
    }
}
