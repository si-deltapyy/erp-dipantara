import type { AxiosInstance } from 'axios'
import type { GradersApi, GraderWriteOptions } from '@/core/types/grader'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import {
    parseGrader,
    parseGraderInput,
    parseGraderLookup,
    parseGraderQuery,
} from '@/api/grader-mapper'
import { parseGraderProvision } from '@/api/grader-mapper'
import { parseId } from '@/api/contracts/value-parsers'

const endpoint = '/api/v1/graders'
export function createHttpGraders(client: AxiosInstance = createHttpClient()): GradersApi {
    const writeConfig = (options: GraderWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            const response = await client.get<unknown>(endpoint, {
                params: parseGraderQuery(query),
                signal,
            })
            return parsePage(response.data, parseGrader)
        },
        async lookup(query, signal) {
            const response = await client.get<unknown>(`${endpoint}/lookup`, {
                params: parseGraderQuery(query),
                signal,
            })
            return parsePage(response.data, parseGraderLookup)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                { signal },
            )
            return parseDetail(response.data, parseGrader).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                endpoint,
                parseGraderInput(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseGrader).data
        },
        async update(id, input, options) {
            const response = await client.put<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                parseGraderInput(input, true),
                writeConfig(options),
            )
            return parseDetail(response.data, parseGrader).data
        },
        async provision(id, input, options) {
            const response = await client.post<unknown>(
                endpoint + '/' + encodeURIComponent(parseId(id)) + '/provision',
                parseGraderProvision(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseGrader).data
        },
        subscribe: () => () => undefined,
    }
}
