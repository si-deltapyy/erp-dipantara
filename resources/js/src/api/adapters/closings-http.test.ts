import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpClosings } from './closings-http'
const zero = {
    issuedInvoiceCount: 0,
    invoiceAmount: '0.00',
    approvedCredit: '0.00',
    outstandingAmount: '0.00',
    overdueAmount: '0.00',
}
const sample = {
    purchaseOrderId: 'po-one',
    version: 3,
    snapshotToken: 'generation:12',
    evaluatedAt: '2026-09-28T12:00:00Z',
    eligible: false,
    reasons: ['buyer_invoice_missing', 'mitra_invoice_missing'],
    quantities: { ordered: 500, assigned: 500, approved: 500, received: 500 },
    openWorkCount: 0,
    summary: {
        purchaseOrderId: 'po-one',
        operationalDate: '2026-09-28',
        receivable: { ...zero, downPayment: zero },
        payable: { ...zero, downPayment: zero },
    },
    allowedActions: [],
}
it('reads typed eligibility from the PO endpoint with cancellation', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: sample } })
    const signal = new AbortController().signal
    expect(await createHttpClosings(client).eligibility('po-one', signal)).toEqual(sample)
    expect(get).toHaveBeenCalledWith('/api/v1/purchase-orders/po-one/closing-eligibility', {
        signal,
    })
})
it.each([
    { eligible: true },
    { eligible: true, reasons: [] },
    { allowedActions: ['request'] },
    { reasons: ['unknown'] },
    { snapshotToken: '' },
    { evaluatedAt: 'bad' },
    { openWorkCount: -1 },
    { quantities: { ...sample.quantities, received: 0.5 } },
    { summary: { ...sample.summary, purchaseOrderId: 'other-po' } },
])('rejects inconsistent or malformed closing projections %j', async (change) => {
    const client = axios.create()
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: { ...sample, ...change } } })
    await expect(
        createHttpClosings(client).eligibility('po-one', new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'validation' })
})

it('creates a versioned closing once and treats malformed success as uncertain', async () => {
    const client = axios.create()
    const input = {
        purchaseOrderId: 'po-one',
        version: 3,
        snapshotToken: 'generation:12',
        notes: 'Ready',
    }
    const closing = {
        id: 'closing-one',
        purchaseOrderId: 'po-one',
        purchaseOrderNumber: 'PO-ONE',
        ownerUserId: 'owner',
        purchaseOrderVersion: 3,
        eligibilityToken: 'generation:12',
        notes: 'Ready',
        status: 'requested',
        rejectionReason: null,
        version: 1,
        createdByUserId: 'admin',
        submittedByUserId: 'admin',
        allowedActions: [],
        createdAt: '2026-09-28T12:00:00Z',
        updatedAt: '2026-09-28T12:00:00Z',
    }
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: closing } })
    const signal = new AbortController().signal
    const api = createHttpClosings(client)
    expect(await api.create(input, { signal, idempotencyKey: 'closing-key' })).toEqual(closing)
    expect(post).toHaveBeenCalledWith('/api/v1/closings', input, {
        signal,
        headers: { 'Idempotency-Key': 'closing-key' },
    })
    post.mockResolvedValueOnce({ data: { data: { ...closing, status: 'draft' } } })
    await expect(
        api.create(input, { signal, idempotencyKey: 'closing-key' }),
    ).rejects.toMatchObject({ kind: 'unexpected' })
    expect(post).toHaveBeenCalledTimes(2)
})

it('validates review payloads before sending and preserves idempotency headers', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: {} } })
    const api = createHttpClosings(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'review-key' }
    await expect(
        api.reject('closing-one', { version: 1, reason: ' ' }, options),
    ).rejects.toMatchObject({ kind: 'validation' })
    expect(post).not.toHaveBeenCalled()
    await expect(api.approve('closing-one', { version: 1 }, options)).rejects.toMatchObject({
        kind: 'unexpected',
    })
    expect(post).toHaveBeenCalledWith(
        '/api/v1/closings/closing-one/approve',
        { version: 1 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'review-key' } },
    )
})
