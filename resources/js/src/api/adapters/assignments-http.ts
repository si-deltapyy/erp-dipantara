import type { AxiosInstance } from 'axios'
import type { Assignment, AssignmentsApi } from '@/core/types/assignment'
import type { OrderWriteOptions } from '@/core/types/order'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import {
    parseAssignment,
    parseAssignmentInput,
    parseAssignmentQuery,
} from '@/api/assignment-mapper'
const endpoint = '/api/v1/assignments'
export function createHttpAssignments(client: AxiosInstance = createHttpClient()): AssignmentsApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: OrderWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (
                    await client.get<unknown>(endpoint, {
                        params: parseAssignmentQuery(query),
                        signal,
                    })
                ).data,
                parseAssignment,
            )
        },
        async get(id, signal) {
            return parseDetail(
                (await client.get<unknown>(path(id), { signal })).data,
                parseAssignment,
            ).data
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parseAssignmentInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (
                    await client.put<unknown>(
                        path(id),
                        parseAssignmentInput(input, true),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Assignment {
    try {
        return parseDetail(value, parseAssignment).data
    } catch {
        throw new ApiError('unexpected')
    }
}
