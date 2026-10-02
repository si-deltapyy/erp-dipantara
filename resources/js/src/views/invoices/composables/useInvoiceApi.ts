import { inject } from 'vue'
import { invoicesApiKey } from '@/api/invoices-api'
import type { InvoicesApi } from '@/core/types/invoice'
export function useInvoiceApi(): InvoicesApi {
    const api = inject(invoicesApiKey)
    if (!api) throw new Error('Purchase delivery API is not configured')
    return api
}
