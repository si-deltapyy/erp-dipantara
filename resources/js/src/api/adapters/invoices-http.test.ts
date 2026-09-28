import { invoiceDraft } from '@/core/domain/invoice-draft'
import { parseInvoiceInput } from '@/api/contracts/invoice-input'
import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpInvoices } from './invoices-http'
import { invoiceFixtures } from '@/api/mocks/invoice-fixtures'
it('reads payable terms with PO and Mitra filters and preserves server totals', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: invoiceFixtures.slice(0, 1), meta: { page: 1, perPage: 20, total: 1 } },
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

it('writes versioned invoice terms and issues without automatically retrying ambiguous outcomes', async () => {
    const client = axios.create()
    const invoice = invoiceFixtures[0]
    if (!invoice) throw new Error('Missing fixture')
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: invoice } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: invoice } })
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: invoice } })
    const api = createHttpInvoices(client)
    const input = invoiceDraft(invoice)
    const options = { signal: new AbortController().signal, idempotencyKey: 'terms-key' }
    await api.get(invoice.id, options.signal)
    expect(get).toHaveBeenCalledWith('/api/v1/invoices/' + invoice.id, { signal: options.signal })
    await api.create(input, options)
    await api.update(invoice.id, { ...input, version: 1, revisionNumber: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        '/api/v1/invoices/' + invoice.id,
        { ...input, version: 1, revisionNumber: 1 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'terms-key' } },
    )
    await api.issue(invoice.id, { version: 2, revisionNumber: 1 }, options)
    expect(post).toHaveBeenLastCalledWith(
        '/api/v1/invoices/' + invoice.id + '/issue',
        { version: 2, revisionNumber: 1 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'terms-key' } },
    )
    post.mockRejectedValueOnce(new Error('ambiguous'))
    await expect(api.issue(invoice.id, { version: 2, revisionNumber: 1 }, options)).rejects.toThrow(
        'ambiguous',
    )
    expect(post).toHaveBeenCalledTimes(3)
    post.mockResolvedValueOnce({ data: { data: {} } })
    await expect(api.create(input, options)).rejects.toMatchObject({ kind: 'unexpected' })
    expect(() =>
        parseInvoiceInput({
            ...input,
            terms: [{ label: 'Invalid', amount: '-1.00', dueDate: null }],
        }),
    ).toThrow()
    expect(() => parseInvoiceInput({ ...input, invoiceDate: '2026-02-30' })).toThrow()
    expect(() => parseInvoiceInput({ ...input, totalAmount: '0.00' })).toThrow()
})

it('uses stable invoice IDs for revision and version history', async () => {
    const invoice = invoiceFixtures[0]
    if (!invoice) throw new Error('Missing fixture')
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockResolvedValue({
        data: {
            data: {
                ...invoice,
                status: 'draft',
                revisionNumber: 2,
                revisionReason: 'Correction',
            },
        },
    })
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [invoice] } })
    const api = createHttpInvoices(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'revision-key' }
    const input = { version: invoice.version, reason: 'Correction', terms: invoice.terms }
    expect((await api.revise(invoice.id, input, options)).id).toBe(invoice.id)
    expect(post).toHaveBeenCalledWith(`/api/v1/invoices/${invoice.id}/revisions`, input, {
        signal: options.signal,
        headers: { 'Idempotency-Key': 'revision-key' },
    })
    expect((await api.versions(invoice.id, options.signal))[0]?.revisionNumber).toBe(1)
    expect(get).toHaveBeenCalledWith(`/api/v1/invoices/${invoice.id}/versions`, {
        signal: options.signal,
    })
    post.mockClear()
    await expect(api.revise(invoice.id, { ...input, reason: '' }, options)).rejects.toMatchObject({
        kind: 'validation',
    })
    expect(post).not.toHaveBeenCalled()
})

it('reads settlement projections with server operational date and rejects inconsistent balances', async () => {
    const client = axios.create()
    const summary = {
        invoiceId: 'invoice-one',
        issuedRevisionNumber: 1,
        operationalDate: '2026-09-28',
        invoiceAmount: '100.00',
        approvedCredit: '20.00',
        outstandingAmount: '80.00',
        overdueAmount: '80.00',
        terms: [
            {
                index: 0,
                label: 'Term',
                amount: '100.00',
                dueDate: '2026-09-27',
                settledAmount: '20.00',
                outstandingAmount: '80.00',
                overdue: true,
            },
        ],
    }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: summary } })
    const api = createHttpInvoices(client)
    const signal = new AbortController().signal
    expect(await api.settlement('invoice-one', signal)).toEqual(summary)
    expect(get).toHaveBeenCalledWith('/api/v1/invoices/invoice-one/settlement', { signal })
    get.mockResolvedValue({ data: { data: { ...summary, overdueAmount: '90.00' } } })
    await expect(api.settlement('invoice-one', signal)).rejects.toMatchObject({
        kind: 'validation',
    })
})
