import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpOrders } from './orders-http'
const order = {
    id: 'order-one',
    purchaseOrderId: 'po-one',
    notes: null,
    version: 1,
    status: 'draft',
    purchaseOrderNumber: 'SYNTHETIC-PO',
    buyerName: 'Synthetic Buyer',
    rejectionReason: null,
    createdAt: '2026-09-27T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
    createdByUserId: 'maker-demo',
    submittedByUserId: null,
    allowedActions: ['update'],
}
it('uses the exact order envelope, filters and mutation key', async () => {
    const client = axios.create()
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: [order], meta: { page: 1, perPage: 20, total: 1 } } })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: order } })
    const api = createHttpOrders(client)
    const signal = new AbortController().signal
    expect(
        (
            await api.list(
                { page: 1, perPage: 20, search: '', sort: '-createdAt', status: 'draft' },
                signal,
            )
        ).data[0]?.purchaseOrderNumber,
    ).toBe('SYNTHETIC-PO')
    expect(get).toHaveBeenCalledWith(
        '/api/v1/orders',
        expect.objectContaining({ signal, params: expect.objectContaining({ status: 'draft' }) }),
    )
    expect(
        (
            await api.create(
                { purchaseOrderId: 'po-one', notes: null },
                { signal, idempotencyKey: 'same-request' },
            )
        ).id,
    ).toBe('order-one')
    expect(post).toHaveBeenCalledWith(
        '/api/v1/orders',
        { purchaseOrderId: 'po-one', notes: null },
        { signal, headers: { 'Idempotency-Key': 'same-request' } },
    )
})
it('rejects malformed successful writes as uncertain and rejects extra input before sending', async () => {
    const client = axios.create()
    const post = vi
        .spyOn(client, 'post')
        .mockResolvedValue({ data: { data: { ...order, version: 0 } } })
    const api = createHttpOrders(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'mutation' }
    await expect(
        api.create({ purchaseOrderId: 'po-one', notes: null }, options),
    ).rejects.toMatchObject({ kind: 'unexpected' })
    post.mockClear()
    await expect(
        api.create({ ...{ purchaseOrderId: 'po-one', notes: null, status: 'approved' } }, options),
    ).rejects.toMatchObject({ kind: 'validation' })
    expect(post).not.toHaveBeenCalled()
})
