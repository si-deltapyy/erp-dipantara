import axios from 'axios'
import { expect, it, vi } from 'vitest'
import { createHttpAssignments } from './assignments-http'
const input = {
    orderId: 'order-one',
    mitraId: 'mitra-one',
    graderId: 'grader-one',
    timberProductId: 'timber-one',
    quantity: 1,
}
const record = {
    ...input,
    id: 'assignment-one',
    version: 1,
    createdAt: '2026-09-27T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
    createdByUserId: 'maker-demo',
    submittedByUserId: null,
    allowedActions: ['update'],
    graderUserId: 'grader-user',
    purchaseOrderNumber: 'SYNTHETIC-PO',
    mitraName: 'Synthetic Mitra',
    graderName: 'Synthetic Grader',
    timberProductName: 'Synthetic Timber',
    orderStatus: 'draft',
    gradingReference: {
        timberProductId: 'timber-one',
        timberProductName: 'Synthetic Timber',
        gradeCodes: ['DEMO'],
    },
}
it('keeps assignment references and safe grading context in the contract', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: record } })
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: [record], meta: { page: 1, perPage: 20, total: 1 } } })
    const api = createHttpAssignments(client)
    const signal = new AbortController().signal
    const saved = await api.create(input, { signal, idempotencyKey: 'stable' })
    expect(saved.graderUserId).toBe('grader-user')
    expect(post).toHaveBeenCalledWith('/api/v1/assignments', input, {
        signal,
        headers: { 'Idempotency-Key': 'stable' },
    })
    expect(
        (
            await api.list(
                { page: 1, perPage: 20, search: '', sort: 'createdAt', orderId: 'order-one' },
                signal,
            )
        ).data[0]?.gradingReference.gradeCodes,
    ).toEqual(['DEMO'])
    expect(get).toHaveBeenCalledWith(
        '/api/v1/assignments',
        expect.objectContaining({
            params: expect.objectContaining({ orderId: 'order-one' }),
            signal,
        }),
    )
})
it('rejects injected price fields and response-only request fields', async () => {
    const client = axios.create()
    const get = vi
        .spyOn(client, 'get')
        .mockResolvedValue({ data: { data: { ...record, purchasePrice: '100.00' } } })
    const post = vi.spyOn(client, 'post')
    const api = createHttpAssignments(client)
    const signal = new AbortController().signal
    await expect(api.get('assignment-one', signal)).rejects.toMatchObject({ kind: 'validation' })
    await expect(
        api.create(
            { ...{ ...input, graderUserId: 'foreign-user' } },
            { signal, idempotencyKey: 'invalid' },
        ),
    ).rejects.toMatchObject({ kind: 'validation' })
    expect(post).not.toHaveBeenCalled()
    expect(get).toHaveBeenCalledOnce()
})
