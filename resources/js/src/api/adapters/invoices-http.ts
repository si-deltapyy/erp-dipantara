import { parseObject, requireKeys, invalidContract } from '@/api/contracts/value-parsers'
import {
    parseInvoiceInput,
    parseInvoiceVersion,
    parseInvoiceRevision,
} from '@/api/contracts/invoice-input'
import type { AxiosInstance } from 'axios'
import type { InvoicesApi, Invoice } from '@/core/types/invoice'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseInvoice, parseInvoiceQuery } from '@/api/invoice-mapper'
const endpoint = '/api/v1/invoices'
export function createHttpInvoices(client: AxiosInstance = createHttpClient()): InvoicesApi {
    const path = (id: string): string => `${endpoint}/${encodeURIComponent(parseId(id))}`
    const config = (options: WorkflowWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            return parsePage(
                (await client.get<unknown>(endpoint, { params: parseInvoiceQuery(query), signal }))
                    .data,
                parseInvoice,
            )
        },
        async get(id, signal) {
            return parseDetail((await client.get<unknown>(path(id), { signal })).data, parseInvoice)
                .data
        },
        async versions(id, signal) {
            const response = parseObject(
                (await client.get<unknown>(`${path(id)}/versions`, { signal })).data,
                'versions',
            )
            requireKeys(response, ['data'], 'versions')
            if (!Array.isArray(response.data)) return invalidContract('data')
            return response.data.map(parseInvoice)
        },
        async revise(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/revisions`,
                        parseInvoiceRevision(input),
                        config(options),
                    )
                ).data,
            )
        },
        async create(input, options) {
            return mutationResponse(
                (await client.post<unknown>(endpoint, parseInvoiceInput(input), config(options)))
                    .data,
            )
        },
        async update(id, input, options) {
            return mutationResponse(
                (
                    await client.put<unknown>(
                        path(id),
                        parseInvoiceInput(input, true),
                        config(options),
                    )
                ).data,
            )
        },
        async issue(id, input, options) {
            return mutationResponse(
                (
                    await client.post<unknown>(
                        `${path(id)}/issue`,
                        parseInvoiceVersion(input),
                        config(options),
                    )
                ).data,
            )
        },
        subscribe: () => () => undefined,
    }
}
function mutationResponse(value: unknown): Invoice {
    try {
        return parseDetail(value, parseInvoice).data
    } catch {
        throw new ApiError('unexpected')
    }
}
