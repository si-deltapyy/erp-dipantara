import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpGradings } from './gradings-http'
import { gradingFixture } from '../../../../../tests/frontend/grading-fixture'
import { gradingDraft } from '@/core/domain/grading-draft'
test('transports grading rows, filters, versions and idempotency with no price fields', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({
        data: { data: [gradingFixture], meta: { page: 1, perPage: 20, total: 1 } },
    })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: gradingFixture } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: gradingFixture } })
    const api = createHttpGradings(client)
    const options = { signal: new AbortController().signal, idempotencyKey: 'stable-key' }
    await api.list(
        {
            page: 1,
            perPage: 20,
            search: '',
            sort: '-createdAt',
            assignmentId: 'assignment-one',
            status: 'draft',
        },
        options.signal,
    )
    expect(get).toHaveBeenCalledWith(
        '/api/v1/gradings',
        expect.objectContaining({
            params: expect.objectContaining({ assignmentId: 'assignment-one', status: 'draft' }),
        }),
    )
    expect((await api.create(gradingDraft(gradingFixture), options)).rowResults[0]?.rowId).toBe(
        'row-one',
    )
    await api.update('grading-one', { ...gradingDraft(gradingFixture), version: 1 }, options)
    await api.submit('grading-one', { version: 2 }, options)
    expect(post).toHaveBeenLastCalledWith(
        '/api/v1/gradings/grading-one/submit',
        { version: 2 },
        { signal: options.signal, headers: { 'Idempotency-Key': 'stable-key' } },
    )
    expect(put).toHaveBeenCalledWith(
        '/api/v1/gradings/grading-one',
        expect.objectContaining({ version: 1 }),
        expect.anything(),
    )
    post.mockClear()
    await expect(
        api.create({ ...gradingDraft(gradingFixture), ...{ price: '100.00' } }, options),
    ).rejects.toMatchObject({ kind: 'validation' })
    expect(post).not.toHaveBeenCalled()
})
test('rejects mismatched row results and treats invalid successful writes as uncertain', async () => {
    const client = axios.create()
    vi.spyOn(client, 'post').mockResolvedValue({
        data: { data: { ...gradingFixture, rowResults: [] } },
    })
    const api = createHttpGradings(client)
    await expect(
        api.create(gradingDraft(gradingFixture), {
            signal: new AbortController().signal,
            idempotencyKey: 'key',
        }),
    ).rejects.toMatchObject({ kind: 'unexpected' })
})
