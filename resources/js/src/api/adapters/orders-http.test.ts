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

it('sends versioned workflow actions and persistent rejection reasons', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockResolvedValue({
        data: { data: { ...order, status: 'rejected', rejectionReason: 'Correct allocation' } },
    })
    const api = createHttpOrders(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'review-key' }
    await api.submit('order-one', { version: 3 }, options)
    await api.approve('order-one', { version: 4 }, options)
    expect(
        (await api.reject('order-one', { version: 4, reason: 'Correct allocation' }, options))
            .rejectionReason,
    ).toBe('Correct allocation')
    expect(post.mock.calls.map((call) => [call[0], call[1]])).toEqual([
        ['/api/v1/orders/order-one/submit', { version: 3 }],
        ['/api/v1/orders/order-one/approve', { version: 4 }],
        ['/api/v1/orders/order-one/reject', { version: 4, reason: 'Correct allocation' }],
    ])
})
