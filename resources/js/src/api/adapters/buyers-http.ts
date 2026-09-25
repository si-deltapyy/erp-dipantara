import type { AxiosInstance } from 'axios'
import type { BuyersApi, BuyerWriteOptions } from '@/core/types/buyer'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseBuyer, parseBuyerInput, parseBuyerLookup, parseBuyerQuery } from '@/api/buyer-mapper'
import { parseId } from '@/api/contracts/value-parsers'

const endpoint = '/api/v1/buyers'
export function createHttpBuyers(client: AxiosInstance = createHttpClient()): BuyersApi {
    const writeConfig = (options: BuyerWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            const response = await client.get<unknown>(endpoint, {
                params: parseBuyerQuery(query),
                signal,
            })
            return parsePage(response.data, parseBuyer)
        },
        async lookup(query, signal) {
            const response = await client.get<unknown>(`${endpoint}/lookup`, {
                params: parseBuyerQuery(query),
                signal,
            })
            return parsePage(response.data, parseBuyerLookup)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                { signal },
            )
            return parseDetail(response.data, parseBuyer).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                endpoint,
                parseBuyerInput(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseBuyer).data
        },
        async update(id, input, options) {
            const response = await client.put<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                parseBuyerInput(input, true),
                writeConfig(options),
            )
            return parseDetail(response.data, parseBuyer).data
        },
        subscribe: () => () => undefined,
    }
}
