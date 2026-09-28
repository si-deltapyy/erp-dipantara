import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpDashboard } from './dashboard-http'
import { parseQueueSummaries } from '@/api/dashboard-queue-mapper'
const record = {
    resource: 'orders',
    id: 'order-one',
    label: 'PO-ONE',
    purchaseOrderNumber: 'PO-ONE',
    status: 'draft',
    version: 1,
    updatedAt: '2026-09-28T12:00:00Z',
    createdAt: '2026-09-28T10:00:00Z',
    targetPath: '/orders/order-one',
}
it('reads paginated queues with explicit filters and rejects an invalid kind before fetching', async () => {
    const client = axios.create()
    const page = { data: [record], meta: { page: 2, perPage: 1, total: 3 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const api = createHttpDashboard(client)
    const signal = new AbortController().signal
    const query = {
        kind: 'orders-processing' as const,
        page: 2,
        perPage: 1,
        search: 'PO',
        sort: '-createdAt' as const,
    }
    expect(await api.queue(query, signal)).toEqual(page)
    expect(get).toHaveBeenCalledWith('/api/v1/dashboard/queue', { params: query, signal })
    await expect(
        api.queue({ ...query, kind: 'unknown' as 'orders-processing' }, signal),
    ).rejects.toMatchObject({ kind: 'validation' })
    expect(get).toHaveBeenCalledTimes(1)
})
it.each([
    { ...record, targetPath: '/orders/other' },
    { ...record, status: 'issued' },
    { ...record, version: 0 },
    { ...record, amount: '100.00' },
    { ...record, resource: 'invoices', targetPath: '/invoices/order-one' },
])('rejects malformed queue entries %j', async (entry) => {
    const client = axios.create()
    vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: [entry], meta: { page: 1, perPage: 20, total: 1 } },
    })
    await expect(
        createHttpDashboard(client).queue(
            { kind: 'orders-processing', page: 1, perPage: 20, search: '', sort: '-createdAt' },
            new AbortController().signal,
        ),
    ).rejects.toMatchObject({ kind: 'validation' })
})
it('requires queue counts and drilldown targets to match their typed kind', () => {
    const summary = {
        kind: 'orders-processing',
        count: 3,
        targetPath: '/dashboard/queue?kind=orders-processing',
    }
    expect(parseQueueSummaries([summary])).toEqual([summary])
    expect(() =>
        parseQueueSummaries([
            { ...summary, targetPath: '/dashboard/queue?kind=invoices-processing' },
        ]),
    ).toThrow()
    expect(() => parseQueueSummaries([summary, summary])).toThrow()
    expect(() => parseQueueSummaries([{ ...summary, count: -1 }])).toThrow()
})

it.each(['purchase-orders', 'orders', 'gradings', 'payments', 'closings'] as const)(
    'reads the %s review queue and rejects another resource',
    async (resource) => {
        const client = axios.create()
        const entry = {
            ...record,
            resource,
            status: resource === 'closings' ? 'requested' : 'submitted',
            targetPath: `/${resource}/${record.id}`,
        }
        const response = { data: [entry], meta: { page: 1, perPage: 20, total: 1 } }
        const get = vi.spyOn(client, 'get').mockResolvedValue({ data: response })
        const query = {
            kind: `${resource}-review` as const,
            page: 1,
            perPage: 20,
            search: '',
            sort: '-createdAt' as const,
        }
        const api = createHttpDashboard(client)
        expect(await api.queue(query, new AbortController().signal)).toEqual(response)
        get.mockResolvedValue({
            data: {
                ...response,
                data: [{ ...record, resource: 'invoices', targetPath: '/invoices/' + record.id }],
            },
        })
        await expect(api.queue(query, new AbortController().signal)).rejects.toMatchObject({
            kind: 'validation',
        })
    },
)
