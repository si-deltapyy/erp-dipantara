import type { AxiosInstance } from 'axios'
import type { InvoicesApi } from '@/core/types/invoice'
import { createHttpClient } from '@/services/http-client'
import { parsePage } from '@/api/contracts/response-parsers'
import { parseInvoice, parseInvoiceQuery } from '@/api/invoice-mapper'
export function createHttpInvoices(client: AxiosInstance = createHttpClient()): InvoicesApi {
    return {
        async list(query, signal) {
            return parsePage(
                (
                    await client.get<unknown>('/api/v1/invoices', {
                        params: parseInvoiceQuery(query),
                        signal,
                    })
                ).data,
                parseInvoice,
            )
        },
    }
}
