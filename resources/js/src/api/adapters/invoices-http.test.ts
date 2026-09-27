import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpInvoices } from './invoices-http'
import { invoiceFixtures } from '@/api/mocks/invoice-fixtures'
it('reads payable terms with PO and Mitra filters and preserves server totals', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: invoiceFixtures, meta: { page: 1, perPage: 20, total: 1 } },
    })
    const signal = new AbortController().signal
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: 'createdAt' as const,
        direction: 'payable' as const,
        purchaseOrderId: 'demo-po-03',
        mitraId: 'demo-mitra-01',
    }
    const response = await createHttpInvoices(client).list(query, signal)
    expect(get).toHaveBeenCalledWith('/api/v1/invoices', { params: query, signal })
    expect(response.data[0]?.terms[0]?.dueDate).toBeNull()
    expect(response.data[0]?.outstandingAmount).toBe('100000.00')
})
