import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpGraders } from './graders-http'
import { graderFixtures } from '../mocks/grader-fixtures'
import { graderDraft } from '@/core/domain/grader-validation'

test('maps all six contract operations with cancellation and explicit write identity', async () => {
    const client = axios.create()
    const grader = graderFixtures[0]
    if (!grader) throw new Error('Missing fixture')
    const page = { data: [grader], meta: { page: 1, perPage: 20, total: 1 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: grader } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: grader } })
    const api = createHttpGraders(client)
    const signal = new AbortController().signal
    const query = { page: 1, perPage: 20, search: 'Demo', sort: '-createdAt' as const }
    expect(await api.list(query, signal)).toEqual(page)
    expect(get).toHaveBeenLastCalledWith('/api/v1/graders', { params: query, signal })
    get.mockResolvedValueOnce({
        data: { ...page, data: [{ id: grader.id, label: grader.name }] },
    })
    expect((await api.lookup(query, signal)).data[0]).toEqual({
        id: grader.id,
        label: grader.name,
    })
    expect(get).toHaveBeenLastCalledWith('/api/v1/graders/lookup', { params: query, signal })
    get.mockResolvedValueOnce({ data: { data: grader } })
    expect(await api.get('grader/a', signal)).toEqual(grader)
    expect(get).toHaveBeenLastCalledWith('/api/v1/graders/grader%2Fa', { signal })
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const input = graderDraft(grader)
    await api.create(input, options)
    expect(post).toHaveBeenCalledWith('/api/v1/graders', input, {
        signal,
        headers: { 'Idempotency-Key': 'attempt' },
    })
    await api.provision(grader.id, { version: 1 }, options)
    expect(post).toHaveBeenLastCalledWith(
        '/api/v1/graders/' + grader.id + '/provision',
        { version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
    await api.update(grader.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        `/api/v1/graders/${grader.id}`,
        { ...input, version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
})
test('rejects malformed live responses and never replays a failed write', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [{ id: 99 }] } })
    const api = createHttpGraders(client)
    const signal = new AbortController().signal
    await expect(api.get('demo', signal)).rejects.toThrow()
    await expect(
        api.create(
            { name: 'Demo', email: 'demo@woodflow.test', phone: '', address: '' },
            { signal, idempotencyKey: 'one' },
        ),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
    await expect(
        api.provision('demo', { version: 1 }, { signal, idempotencyKey: 'provision' }),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(2)
})
