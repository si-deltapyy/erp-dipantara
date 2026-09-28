import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpPayments } from './payments-http'
import { parsePaymentInput } from '@/api/contracts/payment-input'
const input = {
    invoiceId: 'invoice-one',
    paymentDate: '2026-09-28',
    sourceAccountId: 'buyer-account',
    destinationAccountId: 'company-account',
    cashAmount: '950000.00',
    withholdingAmount: '50000.00',
    roundingAdjustment: '-1.00',
    proofDocumentId: 'proof-one',
    notes: null,
}
const payment = {
    ...input,
    id: 'payment-one',
    ownerUserId: 'owner-one',
    purchaseOrderId: 'po-one',
    purchaseOrderNumber: 'PO-DEMO',
    invoiceNumber: 'DEMO-INV',
    counterpartyName: 'Buyer Simulasi',
    direction: 'receivable',
    sourceAccountLabel: 'Buyer',
    destinationAccountLabel: 'Company',
    creditAmount: '999999.00',
    rejectionReason: null,
    status: 'draft',
    version: 1,
    createdByUserId: 'owner-one',
    submittedByUserId: null,
    allowedActions: ['update', 'submit'],
    createdAt: '2026-09-28T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z',
}
it('preserves scoped payment filters and separated amounts across versioned writes', async () => {
    const client = axios.create()
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: [payment], meta: { page: 1, perPage: 20, total: 1 } } })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: payment } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: payment } })
    const api = createHttpPayments(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'payment-key' }
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: 'createdAt' as const,
        invoiceId: input.invoiceId,
        direction: 'receivable' as const,
        status: 'draft' as const,
    }
    expect((await api.list(query, options.signal)).data[0]?.creditAmount).toBe('999999.00')
    expect(get).toHaveBeenCalledWith('/api/v1/payments', { params: query, signal: options.signal })
    await api.create(input, options)
    await api.update(payment.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        '/api/v1/payments/payment-one',
        { ...input, version: 1 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'payment-key' } },
    )
    await api.submit(payment.id, { version: 2 }, options)
    expect(post).toHaveBeenLastCalledWith(
        '/api/v1/payments/payment-one/submit',
        { version: 2 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'payment-key' } },
    )
    post.mockResolvedValueOnce({ data: { data: { ...payment, creditAmount: '1000000.00' } } })
    await expect(api.create(input, options)).rejects.toMatchObject({ kind: 'unexpected' })
    expect(post).toHaveBeenCalledTimes(3)
})
it('rejects unknown fields, impossible dates, negative cash and nonpositive combined credit', () => {
    for (const invalid of [
        { ownerUserId: 'spoof' },
        { paymentDate: '2026-02-30' },
        { cashAmount: '-1.00' },
        { cashAmount: '0.00', withholdingAmount: '0.00', roundingAdjustment: '0.00' },
        { cashAmount: '1.001' },
    ])
        expect(() => parsePaymentInput({ ...input, ...invalid })).toThrow()
    expect(
        parsePaymentInput({ ...input, cashAmount: '0.00', roundingAdjustment: '0.00' })
            .withholdingAmount,
    ).toBe('50000.00')
})
