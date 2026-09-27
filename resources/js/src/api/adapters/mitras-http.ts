import type { AxiosInstance } from 'axios'
import type { MitrasApi, MitraWriteOptions } from '@/core/types/mitra'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseMitra, parseMitraInput, parseMitraLookup, parseMitraQuery } from '@/api/mitra-mapper'
import { parseId } from '@/api/contracts/value-parsers'

const endpoint = '/api/v1/mitras'
export function createHttpMitras(client: AxiosInstance = createHttpClient()): MitrasApi {
    const writeConfig = (options: MitraWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            const response = await client.get<unknown>(endpoint, {
                params: parseMitraQuery(query),
                signal,
            })
            return parsePage(response.data, parseMitra)
        },
        async lookup(query, signal) {
            const response = await client.get<unknown>(`${endpoint}/lookup`, {
                params: parseMitraQuery(query),
                signal,
            })
            return parsePage(response.data, parseMitraLookup)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                { signal },
            )
            return parseDetail(response.data, parseMitra).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                endpoint,
                parseMitraInput(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseMitra).data
        },
        async update(id, input, options) {
            const response = await client.put<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                parseMitraInput(input, true),
                writeConfig(options),
            )
            return parseDetail(response.data, parseMitra).data
        },
        subscribe: () => () => undefined,
    }
}
