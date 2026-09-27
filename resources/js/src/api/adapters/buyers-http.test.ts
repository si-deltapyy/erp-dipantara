import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpBuyers } from './buyers-http'
import { buyerFixtures } from '../mocks/buyer-fixtures'
import { buyerDraft } from '@/core/domain/buyer-validation'

test('maps all five contract operations with cancellation and explicit write identity', async () => {
    const client = axios.create()
    const buyer = buyerFixtures[0]
    if (!buyer) throw new Error('Missing fixture')
    const page = { data: [buyer], meta: { page: 1, perPage: 20, total: 1 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: buyer } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: buyer } })
    const api = createHttpBuyers(client)
    const signal = new AbortController().signal
    const query = { page: 1, perPage: 20, search: 'Demo', sort: '-createdAt' as const }
    expect(await api.list(query, signal)).toEqual(page)
    expect(get).toHaveBeenLastCalledWith('/api/v1/buyers', { params: query, signal })
    get.mockResolvedValueOnce({
        data: { ...page, data: [{ id: buyer.id, label: buyer.companyName }] },
    })
    expect((await api.lookup(query, signal)).data[0]).toEqual({
        id: buyer.id,
        label: buyer.companyName,
    })
    expect(get).toHaveBeenLastCalledWith('/api/v1/buyers/lookup', { params: query, signal })
    get.mockResolvedValueOnce({ data: { data: buyer } })
    expect(await api.get('buyer/a', signal)).toEqual(buyer)
    expect(get).toHaveBeenLastCalledWith('/api/v1/buyers/buyer%2Fa', { signal })
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const input = buyerDraft(buyer)
    await api.create(input, options)
    expect(post).toHaveBeenCalledWith('/api/v1/buyers', input, {
        signal,
        headers: { 'Idempotency-Key': 'attempt' },
    })
    await api.update(buyer.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        `/api/v1/buyers/${buyer.id}`,
        { ...input, version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
})
test('rejects malformed live responses and never replays a failed write', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [{ id: 99 }] } })
    const api = createHttpBuyers(client)
    const signal = new AbortController().signal
    await expect(api.get('demo', signal)).rejects.toThrow()
    await expect(
        api.create(
            { companyName: 'Demo', contactName: 'Demo', phone: '', address: '' },
            { signal, idempotencyKey: 'one' },
        ),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
})
