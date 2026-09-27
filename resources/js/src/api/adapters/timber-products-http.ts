import type { AxiosInstance } from 'axios'
import type { TimberProductsApi, TimberProductWriteOptions } from '@/core/types/timber-product'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import {
    parseTimberProduct,
    parseTimberProductInput,
    parseTimberProductLookup,
    parseTimberProductQuery,
} from '@/api/timber-product-mapper'
import { parseId } from '@/api/contracts/value-parsers'

const endpoint = '/api/v1/timber-products'
export function createHttpTimberProducts(
    client: AxiosInstance = createHttpClient(),
): TimberProductsApi {
    const writeConfig = (options: TimberProductWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            const response = await client.get<unknown>(endpoint, {
                params: parseTimberProductQuery(query),
                signal,
            })
            return parsePage(response.data, parseTimberProduct)
        },
        async lookup(query, signal) {
            const response = await client.get<unknown>(`${endpoint}/lookup`, {
                params: parseTimberProductQuery(query),
                signal,
            })
            return parsePage(response.data, parseTimberProductLookup)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                { signal },
            )
            return parseDetail(response.data, parseTimberProduct).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                endpoint,
                parseTimberProductInput(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseTimberProduct).data
        },
        async update(id, input, options) {
            const response = await client.put<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                parseTimberProductInput(input, true),
                writeConfig(options),
            )
            return parseDetail(response.data, parseTimberProduct).data
        },
        subscribe: () => () => undefined,
    }
}
