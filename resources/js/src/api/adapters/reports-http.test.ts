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
