import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpMitras } from './mitras-http'
import { mitraFixtures } from '../mocks/mitra-fixtures'
import { mitraDraft } from '@/core/domain/mitra-validation'

test('maps all five contract operations with cancellation and explicit write identity', async () => {
    const client = axios.create()
    const mitra = mitraFixtures[0]
    if (!mitra) throw new Error('Missing fixture')
    const page = { data: [mitra], meta: { page: 1, perPage: 20, total: 1 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: mitra } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: mitra } })
    const api = createHttpMitras(client)
    const signal = new AbortController().signal
    const query = { page: 1, perPage: 20, search: 'Demo', sort: '-createdAt' as const }
    expect(await api.list(query, signal)).toEqual(page)
    expect(get).toHaveBeenLastCalledWith('/api/v1/mitras', { params: query, signal })
    get.mockResolvedValueOnce({
        data: { ...page, data: [{ id: mitra.id, label: mitra.name }] },
    })
    expect((await api.lookup(query, signal)).data[0]).toEqual({
        id: mitra.id,
        label: mitra.name,
    })
    expect(get).toHaveBeenLastCalledWith('/api/v1/mitras/lookup', { params: query, signal })
    get.mockResolvedValueOnce({ data: { data: mitra } })
    expect(await api.get('mitra/a', signal)).toEqual(mitra)
    expect(get).toHaveBeenLastCalledWith('/api/v1/mitras/mitra%2Fa', { signal })
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const input = mitraDraft(mitra)
    await api.create(input, options)
    expect(post).toHaveBeenCalledWith('/api/v1/mitras', input, {
        signal,
        headers: { 'Idempotency-Key': 'attempt' },
    })
    await api.update(mitra.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        `/api/v1/mitras/${mitra.id}`,
        { ...input, version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
})
test('rejects malformed live responses and never replays a failed write', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [{ id: 99 }] } })
    const api = createHttpMitras(client)
    const signal = new AbortController().signal
    await expect(api.get('demo', signal)).rejects.toThrow()
    await expect(
        api.create({ name: 'Demo', phone: '', address: '' }, { signal, idempotencyKey: 'one' }),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
})
