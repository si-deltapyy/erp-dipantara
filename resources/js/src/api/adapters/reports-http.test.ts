import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpReports } from './reports-http'
const query = {
    page: 1,
    perPage: 20,
    search: '',
    sort: '-createdAt' as const,
    period: '2026-09',
    graderId: 'grader-1',
}
const row = {
    period: '2026-09',
    timberProductId: 'timber-1',
    timberProductName: 'Wood',
    category: 'A2',
    quantity: 2,
    volumeM3: '0.250000',
}
test('forwards report filters and rejects invalid periods or incompatible responses', async () => {
    const client = axios.create()
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: [row], meta: { page: 1, perPage: 20, total: 1 } } })
    const api = createHttpReports(client)
    const signal = new AbortController().signal
    expect((await api.production(query, signal)).data).toEqual([row])
    expect(get).toHaveBeenLastCalledWith('/api/v1/reports/production', { params: query, signal })
    await expect(api.production({ ...query, period: '2026-13' }, signal)).rejects.toThrow()
    expect(get).toHaveBeenCalledTimes(1)
    get.mockResolvedValue({
        data: { data: [{ ...row, period: '2026-08' }], meta: { page: 1, perPage: 20, total: 1 } },
    })
    await expect(api.production(query, signal)).rejects.toThrow()
})

test('exports the canonical filter with one idempotency key and no automatic retry', async () => {
    const client = axios.create()
    const document = {
        id: 'export-1',
        fileName: 'production-2026-09.csv',
        mimeType: 'text/csv',
        sizeBytes: 100,
    }
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: document } })
    const signal = new AbortController().signal
    const input = {
        kind: 'production' as const,
        period: '2026-09',
        format: 'csv' as const,
        filters: { graderId: 'grader-1' },
    }
    expect(
        await createHttpReports(client).export(input, { signal, idempotencyKey: 'one' }),
    ).toEqual(document)
    expect(post).toHaveBeenLastCalledWith(
        '/api/v1/reports/exports',
        { ...input, filters: { ...input.filters, search: '', sort: '-createdAt' } },
        { signal, headers: { 'Idempotency-Key': 'one' } },
    )
    post.mockRejectedValue(new Error('network'))
    await expect(
        createHttpReports(client).export(input, { signal, idempotencyKey: 'one' }),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(2)
})
