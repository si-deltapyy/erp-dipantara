import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpPurchaseOrders } from './purchase-orders-http'
import { purchaseOrderFixtures } from '../mocks/purchase-order-fixtures'
import { purchaseOrderDraft } from '@/core/domain/purchase-order-draft'
import { canAccess } from '@/core/domain/access-policy'
import { sessionFixtures } from '../mocks/session-fixtures'

test('maps five PO operations, filters, versions, headers and response labels', async () => {
    const order = purchaseOrderFixtures[0]
    if (!order) throw new Error('Missing fixture')
    const client = axios.create()
    const response = { data: order }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: response })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: response })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: response })
    const api = createHttpPurchaseOrders(client)
    const signal = new AbortController().signal
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const headers = { signal, headers: { 'Idempotency-Key': 'attempt' } }
    const input = purchaseOrderDraft(order)
    expect(await api.get('po/a', signal)).toEqual(order)
    expect(get).toHaveBeenLastCalledWith('/api/v1/purchase-orders/po%2Fa', { signal })
    const query = {
        page: 1,
        perPage: 20,
        search: 'DEMO',
        sort: '-createdAt' as const,
        status: 'draft' as const,
        buyerId: order.buyerId,
    }
    get.mockResolvedValueOnce({ data: { data: [order], meta: { page: 1, perPage: 20, total: 1 } } })
    expect((await api.list(query, signal)).data).toEqual([order])
    expect(get).toHaveBeenLastCalledWith('/api/v1/purchase-orders', { params: query, signal })
    await api.create(input, options)
    expect(post).toHaveBeenLastCalledWith('/api/v1/purchase-orders', input, headers)
    await api.update(order.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenLastCalledWith(
        `/api/v1/purchase-orders/${order.id}`,
        { ...input, version: 1 },
        headers,
    )
    await api.submit(order.id, { version: 1 }, options)
    expect(post).toHaveBeenLastCalledWith(
        `/api/v1/purchase-orders/${order.id}/submit`,
        { version: 1 },
        headers,
    )
})
test('does not replay failed submits or accept missing response labels', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: { ...purchaseOrderFixtures[0], buyerName: undefined } },
    })
    const api = createHttpPurchaseOrders(client)
    const signal = new AbortController().signal
    await expect(api.get('one', signal)).rejects.toThrow()
    await expect(
        api.submit('one', { version: 1 }, { signal, idempotencyKey: 'one' }),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
})
test('route alternatives preserve required permissions and never bypass by role', () => {
    const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
    if (!user) throw new Error('Missing fixture')
    const alternatives = ['purchase-orders.read.own', 'purchase-orders.read.all']
    expect(canAccess(user, [], undefined, alternatives)).toBe(true)
    expect(
        canAccess({ ...user, roles: ['admin'], permissions: [] }, [], undefined, alternatives),
    ).toBe(false)
    expect(canAccess(user, ['missing'], undefined, alternatives)).toBe(false)
})

test('preserves read-only Maker actions and server ownership on Admin submit', async () => {
    const source = purchaseOrderFixtures[25]
    if (!source) throw new Error('Missing foreign PO fixture')
    const client = axios.create()
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: source } })
    const submitted = {
        ...source,
        version: source.version + 1,
        status: 'submitted',
        submittedByUserId: 'admin-demo',
    }
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: submitted } })
    const api = createHttpPurchaseOrders(client)
    const signal = new AbortController().signal
    expect((await api.get(source.id, signal)).allowedActions).toEqual([])
    const result = await api.submit(
        source.id,
        { version: source.version },
        {
            signal,
            idempotencyKey: 'admin-submit',
        },
    )
    expect(result.createdByUserId).toBe('multiple-demo')
    expect(result.submittedByUserId).toBe('admin-demo')
    expect(result.allowedActions).toEqual([])
    expect(post.mock.calls[0]?.[1]).toEqual({ version: source.version })
})
