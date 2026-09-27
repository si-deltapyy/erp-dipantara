import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpTimberProducts } from './timber-products-http'
import { timberProductFixtures } from '../mocks/timber-product-fixtures'
import { timberProductDraft } from '@/core/domain/timber-product-validation'

test('maps all five contract operations with cancellation and explicit write identity', async () => {
    const client = axios.create()
    const product = timberProductFixtures[0]
    if (!product) throw new Error('Missing fixture')
    const page = { data: [product], meta: { page: 1, perPage: 20, total: 1 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: product } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: product } })
    const api = createHttpTimberProducts(client)
    expect(api.previewVolume).toBeUndefined()
    const signal = new AbortController().signal
    const query = { page: 1, perPage: 20, search: 'Demo', sort: '-createdAt' as const }
    expect(await api.list(query, signal)).toEqual(page)
    expect(get).toHaveBeenLastCalledWith('/api/v1/timber-products', { params: query, signal })
    get.mockResolvedValueOnce({
        data: { ...page, data: [{ id: product.id, label: product.name }] },
    })
    expect((await api.lookup(query, signal)).data[0]).toEqual({
        id: product.id,
        label: product.name,
    })
    expect(get).toHaveBeenLastCalledWith('/api/v1/timber-products/lookup', {
        params: query,
        signal,
    })
    get.mockResolvedValueOnce({ data: { data: product } })
    expect(await api.get('timber/a', signal)).toEqual(product)
    expect(get).toHaveBeenLastCalledWith('/api/v1/timber-products/timber%2Fa', { signal })
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const input = timberProductDraft(product)
    await api.create(input, options)
    expect(post).toHaveBeenCalledWith('/api/v1/timber-products', input, {
        signal,
        headers: { 'Idempotency-Key': 'attempt' },
    })
    await api.update(product.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        `/api/v1/timber-products/${product.id}`,
        { ...input, version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
})
test('rejects malformed live responses and never replays a failed write', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [{ id: 99 }] } })
    const api = createHttpTimberProducts(client)
    const signal = new AbortController().signal
    await expect(api.get('demo', signal)).rejects.toThrow()
    await expect(
        api.create(
            {
                name: 'Demo',
                gradeCode: 'DEMO',
                diameterCm: '20.00',
                lengthM: '2.00',
                purchasePrice: '0.00',
                salePrice: '1.00',
            },
            { signal, idempotencyKey: 'one' },
        ),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
})
