import axios from 'axios'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
beforeEach(() => vi.stubGlobal('Blob', NodeBlob))
afterEach(() => vi.unstubAllGlobals())
import { createHttpDocuments } from './documents-http'
import { createHttpClient } from '@/services/http-client'
import { validateDocumentUpload } from '../document-mapper'
import type { DocumentUpload } from '@/core/types/document'

const reference = {
    id: 'document-1',
    fileName: 'synthetic.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 8,
}
const file = new File(['%PDF-1.7'], reference.fileName, { type: reference.mimeType })
const input: DocumentUpload = {
    parentType: 'purchase-order',
    parentId: 'po-1',
    purpose: 'approved_po',
    file,
}
const signal = new AbortController().signal

test('encodes existing and staged parent IDs as required multipart parts without a manual boundary', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: reference } })
    const api = createHttpDocuments(client)
    for (const parentId of ['po-1', null]) {
        expect(
            await api.upload({ ...input, parentId }, { signal, idempotencyKey: 'upload-1' }),
        ).toEqual(reference)
        const call = post.mock.calls.at(-1)
        const form: unknown = call?.[1]
        expect(form).toBeInstanceOf(FormData)
        if (!(form instanceof FormData)) throw new Error('Missing form')
        expect(form.has('parentId')).toBe(true)
        expect(form.get('parentId')).toBe(parentId ?? '')
        expect(form.get('file')).toBe(file)
        expect(call?.[2]?.headers).toEqual({ 'Idempotency-Key': 'upload-1' })
        expect(call?.[2]?.signal).toBe(signal)
    }
})
test('rejects omitted, empty and literal null domain IDs while allowing actual null', () => {
    for (const parentId of [undefined, '', 'null']) {
        expect(() =>
            validateDocumentUpload({ ...input, parentId } as DocumentUpload, 'key'),
        ).toThrow()
    }
    expect(() => validateDocumentUpload({ ...input, parentId: null }, 'key')).not.toThrow()
})
test('rejects incorrect MIME, size, purpose and malformed mutation responses', async () => {
    const client = axios.create()
    vi.spyOn(client, 'post').mockResolvedValue({ data: { data: { ...reference, sizeBytes: '8' } } })
    const api = createHttpDocuments(client)
    await expect(api.upload(input, { signal, idempotencyKey: 'key' })).rejects.toMatchObject({
        kind: 'unexpected',
    })
    for (const invalid of [
        { ...input, purpose: 'sakr' as const },
        { ...input, file: new File([], 'empty.pdf', { type: 'application/pdf' }) },
        { ...input, file: new File(['html'], 'unsafe.html', { type: 'text/html' }) },
        {
            ...input,
            file: new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', {
                type: 'application/pdf',
            }),
        },
    ])
        await expect(api.upload(invalid, { signal, idempotencyKey: 'key' })).rejects.toMatchObject({
            kind: 'validation',
        })
})
test('parses list envelopes without pagination and downloads binary with a safe filename', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValueOnce({ data: { data: [reference] } })
    const api = createHttpDocuments(client)
    expect(await api.list({ parentType: 'purchase-order', parentId: 'po-1' }, signal)).toEqual([
        reference,
    ])
    const blob = new Blob(['%PDF-1.7'])
    get.mockResolvedValueOnce({
        status: 200,
        data: blob,
        headers: { 'content-disposition': "attachment; filename*=UTF-8''..%2Fsynthetic.pdf" },
    })
    expect(await api.download('doc/a', signal)).toEqual({ blob, fileName: '.._synthetic.pdf' })
    expect(get.mock.calls.at(-1)?.[0]).toBe('/api/v1/documents/doc%2Fa/content')
})
test.each([
    [401, 'unauthenticated'],
    [419, 'csrf'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [422, 'validation'],
    [500, 'unexpected'],
])(
    'normalizes binary error envelopes for status %s through the real transport',
    async (status, kind) => {
        const client = createHttpClient()
        client.defaults.adapter = async (config) => ({
            config,
            status: Number(status),
            statusText: 'Error',
            headers: {},
            data: new Blob([
                JSON.stringify({
                    code: 'DOCUMENT_ERROR',
                    requestId: 'synthetic-request',
                    errors: { file: ['invalid'] },
                }),
            ]),
        })
        const api = createHttpDocuments(client)
        await expect(api.download('document-1', signal)).rejects.toMatchObject({
            kind,
            code: 'DOCUMENT_ERROR',
            requestId: 'synthetic-request',
            fieldErrors: { file: ['invalid'] },
        })
    },
)
