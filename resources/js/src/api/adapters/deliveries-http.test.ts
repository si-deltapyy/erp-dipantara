import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpDeliveries } from './deliveries-http'
import { deliveryFixture } from '../../../../../tests/frontend/delivery-fixture'
import { deliveryDraft } from '@/core/domain/delivery-draft'
import { parseAvailableTimber, parseDeliveryInput } from '@/api/delivery-mapper'

test('sends versioned allocation snapshots with cancellation and stable idempotency', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: [deliveryFixture], meta: { page: 1, perPage: 20, total: 1 } },
    })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: deliveryFixture } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: deliveryFixture } })
    const api = createHttpDeliveries(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'allocation-key' }
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: '-createdAt' as const,
        purchaseOrderId: 'po-one',
        status: 'draft' as const,
    }
    expect((await api.list(query, options.signal)).data[0]?.id).toBe(deliveryFixture.id)
    expect(get).toHaveBeenCalledWith('/api/v1/deliveries', {
        params: query,
        signal: options.signal,
    })
    get.mockResolvedValue({ data: { data: deliveryFixture } })
    await api.get(deliveryFixture.id, options.signal)
    const input = { ...deliveryDraft(deliveryFixture), availabilityToken: 'generation:7' }
    await api.create(input, options)
    await api.update(deliveryFixture.id, { ...input, version: 1 }, options)
    expect(post).toHaveBeenCalledWith('/api/v1/deliveries', input, {
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    expect(put).toHaveBeenCalledWith(
        '/api/v1/deliveries/delivery-one',
        { ...input, version: 1 },
        expect.anything(),
    )
    post.mockClear()
    await expect(api.create({ ...input, ...{ price: '1.00' } }, options)).rejects.toMatchObject({
        kind: 'validation',
    })
    expect(post).not.toHaveBeenCalled()
})
test('validates availability totals and sends only supported snapshot query fields', async () => {
    const client = axios.create()
    const stock = {
        gradingId: 'grading-one',
        rowId: 'row-one',
        assignmentId: 'assignment-one',
        mitraName: 'Mitra Simulasi',
        timberProductName: 'Kayu Simulasi',
        approvedQuantity: 500,
        reservedQuantity: 200,
        shippedQuantity: 100,
        availableQuantity: 200,
        snapshotToken: 'generation:7',
        lineageIds: ['grading-one'],
    }
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: [stock], meta: { page: 1, perPage: 20, total: 1 } } })
    const signal = new AbortController().signal
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: 'createdAt' as const,
        purchaseOrderId: 'po-one',
        excludeDeliveryId: 'delivery-one',
    }
    expect((await createHttpDeliveries(client).availability(query, signal)).data).toEqual([stock])
    expect(get).toHaveBeenCalledWith('/api/v1/deliveries/availability', { params: query, signal })
    expect(() => parseAvailableTimber({ ...stock, availableQuantity: 201 })).toThrow()
})
test('rejects duplicate rows and impossible dates before writes and preserves uncertain outcomes', async () => {
    const input = { ...deliveryDraft(deliveryFixture), availabilityToken: 'generation:1' }
    expect(() =>
        parseDeliveryInput({ ...input, allocations: [...input.allocations, ...input.allocations] }),
    ).toThrow()
    expect(() => parseDeliveryInput({ ...input, deliveryDate: '2026-02-30' })).toThrow()
    const client = axios.create()
    vi.spyOn(client, 'post').mockResolvedValue({
        data: { data: { ...deliveryFixture, allocationContext: [] } },
    })
    await expect(
        createHttpDeliveries(client).create(input, {
            signal: new AbortController().signal,
            idempotencyKey: 'key',
        }),
    ).rejects.toMatchObject({ kind: 'unexpected' })
})

test('dispatches and receives using version and idempotency without retrying writes', async () => {
    const client = axios.create()
    const post = vi
        .spyOn(client, 'post')
        .mockResolvedValue({ data: { data: { ...deliveryFixture, status: 'dispatched' } } })
    const api = createHttpDeliveries(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'transition' }
    expect((await api.dispatch('delivery-one', { version: 2 }, options)).status).toBe('dispatched')
    post.mockResolvedValue({ data: { data: { ...deliveryFixture, status: 'received' } } })
    expect((await api.receive('delivery-one', { version: 3 }, options)).status).toBe('received')
    expect(post.mock.calls.map((call) => [call[0], call[1]])).toEqual([
        ['/api/v1/deliveries/delivery-one/dispatch', { version: 2 }],
        ['/api/v1/deliveries/delivery-one/receive', { version: 3 }],
    ])
    expect(post).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), {
        signal: options.signal,
        headers: { 'Idempotency-Key': 'transition' },
    })
    post.mockRejectedValueOnce(new Error('ambiguous network result'))
    await expect(api.receive('delivery-one', { version: 3 }, options)).rejects.toThrow('ambiguous')
    expect(post).toHaveBeenCalledTimes(3)
})
