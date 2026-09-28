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
