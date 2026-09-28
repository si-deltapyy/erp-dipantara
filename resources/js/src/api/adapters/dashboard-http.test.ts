import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpDashboard } from './dashboard-http'
const metric = {
    key: 'active-purchase-orders',
    value: 0,
    unit: 'count',
    targetPath: '/purchase-orders?status=approved',
}
const sample = { asOf: '2026-09-28T12:00:00Z', metrics: [metric], activity: [], queues: [] }
it('reads the current scoped dashboard snapshot with cancellation', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { data: sample } })
    const signal = new AbortController().signal
    expect(await createHttpDashboard(client).get(signal)).toEqual(sample)
    expect(get).toHaveBeenCalledWith('/api/v1/dashboard', { signal })
})
it.each([
    { ...metric, value: '12.500000' },
    { ...metric, value: -1 },
    { ...metric, value: 0.5 },
    { ...metric, targetPath: 'https://example.test' },
    { ...metric, targetPath: '//example.test' },
    { ...metric, targetPath: '/purchase-orders?status=draft' },
    { ...metric, key: 'unrecognized' },
    { ...metric, unit: 'IDR' },
    { ...metric, price: '100.00' },
    {
        key: 'buyer-outstanding',
        unit: 'IDR',
        value: '-1.00',
        targetPath: '/invoices?direction=receivable&balance=outstanding',
    },
])('rejects malformed values and untrusted drilldown targets %j', async (invalidMetric) => {
    const client = axios.create()
    vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: { ...sample, metrics: [invalidMetric] } },
    })
    await expect(
        createHttpDashboard(client).get(new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'validation' })
})
it('rejects duplicate metrics and distinguishes a failed response from an empty snapshot', async () => {
    const client = axios.create()
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: { ...sample, metrics: [metric, metric] } } })
    const api = createHttpDashboard(client)
    const signal = new AbortController().signal
    await expect(api.get(signal)).rejects.toMatchObject({ kind: 'validation' })
    get.mockRejectedValueOnce(new Error('offline'))
    await expect(api.get(signal)).rejects.toThrow('offline')
    get.mockResolvedValueOnce({ data: { data: { ...sample, metrics: [] } } })
    expect((await api.get(signal)).metrics).toEqual([])
})
