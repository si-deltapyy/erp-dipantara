import type { AxiosInstance } from 'axios'
import type { InvoicesApi } from '@/core/types/invoice'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'

export function createHttpInvoices(client: AxiosInstance = createHttpClient()): InvoicesApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/invoices', { signal })
            return parseCollection(response.data, () => {
                throw new ApiError('unexpected', {}, 'record.unconfirmed')
            })
        },
        get: unavailable,
        create: unavailable,
        update: unavailable,
        summary: unavailable,
        settlement: unavailable,
        versions: unavailable,
        issue: unavailable,
        revise: unavailable,
        subscribe: () => () => undefined,
    }
}
