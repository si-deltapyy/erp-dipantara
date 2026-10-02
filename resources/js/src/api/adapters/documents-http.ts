import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { DocumentsApi } from '@/core/types/document'
import { createHttpClient } from '@/services/http-client'
import { normalizeApiError } from '@/services/api-error'
import { ApiError } from '@/core/types/api-error'
import { safeDocumentName } from '@/core/domain/document-file'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseDocument, validateDocumentParent, validateDocumentUpload } from '../document-mapper'

const endpoint = '/api/v1/documents'
export function createHttpDocuments(client: AxiosInstance = createHttpClient()): DocumentsApi {
    return {
        async list(parent, signal) {
            validateDocumentParent(parent)
            return parseDetail(
                (await client.get<unknown>(endpoint, { params: parent, signal })).data,
                (value) => {
                    if (!Array.isArray(value)) throw new ApiError('unexpected')
                    return value.map(parseDocument)
                },
            ).data
        },
        async upload(input, options) {
            validateDocumentUpload(input, options.idempotencyKey)
            const form = new FormData()
            form.append('parentType', input.parentType)
            form.append('parentId', input.parentId ?? '')
            form.append('purpose', input.purpose)
            form.append('file', input.file)
            const response = await client.post<unknown>(endpoint, form, {
                signal: options.signal,
                headers: { 'Idempotency-Key': options.idempotencyKey },
                onUploadProgress: (event) => {
                    if (event.total)
                        options.onProgress?.(
                            Math.min(100, Math.round((event.loaded / event.total) * 100)),
                        )
                },
            })
            try {
                return parseDetail(response.data, parseDocument).data
            } catch {
                throw new ApiError('unexpected')
            }
        },
        async download(id, signal) {
            const response = await client.get<Blob>(
                `${endpoint}/${encodeURIComponent(parseId(id))}/content`,
                {
                    signal,
                    responseType: 'blob',
                    validateStatus: () => true,
                },
            )
            if (response.status !== 200) {
                let envelope: unknown
                try {
                    envelope = JSON.parse(await response.data.text())
                } catch {
                    envelope = undefined
                }
                throw normalizeApiError(
                    new axios.AxiosError('download', undefined, response.config, undefined, {
                        ...response,
                        data: envelope,
                    }),
                )
            }
            if (!(response.data instanceof Blob) || response.data.size === 0)
                throw new ApiError('unexpected')
            return {
                blob: response.data,
                fileName: attachmentName(String(response.headers['content-disposition'] ?? '')),
            }
        },
        subscribe: () => () => undefined,
    }
}
function attachmentName(header: string): string {
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1]
    if (encoded) {
        try {
            return safeDocumentName(decodeURIComponent(encoded))
        } catch {
            return 'document'
        }
    }
    return safeDocumentName(
        /filename="([^"]+)"/i.exec(header)?.[1] ??
            /filename=([^;]+)/i.exec(header)?.[1] ??
            'document',
    )
}
