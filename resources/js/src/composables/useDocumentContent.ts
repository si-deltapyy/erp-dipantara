import { onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { DocumentReference } from '@/core/types/document'
import {
    documentMimeTypes,
    safeDocumentName,
    validateDocumentSignature,
} from '@/core/domain/document-file'
import { ApiError } from '@/core/types/api-error'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { useSessionStore } from '@/stores/session'
import { useDocumentsApi } from './useDocumentsApi'
import { useSession } from './useSession'

interface DocumentContentState {
    pendingId: Ref<string>
    error: Ref<string>
    preview: Ref<{ url: string; document: DocumentReference } | undefined>
    open(document: DocumentReference, mode: 'preview' | 'download'): Promise<void>
    close(): void
}
export function useDocumentContent(
    identity: () => string,
    allowed: () => boolean,
): DocumentContentState {
    const api = useDocumentsApi()
    const session = useSession()
    const store = useSessionStore()
    const pendingId = ref('')
    const error = ref('')
    const preview = ref<{ url: string; document: DocumentReference }>()
    const downloads = new Map<string, ReturnType<typeof setTimeout>>()
    let active: AbortController | undefined
    function close(): void {
        if (preview.value) URL.revokeObjectURL(preview.value.url)
        preview.value = undefined
    }
    function cleanup(): void {
        active?.abort()
        pendingId.value = ''
        close()
        for (const [url, timer] of downloads) {
            clearTimeout(timer)
            URL.revokeObjectURL(url)
        }
        downloads.clear()
    }
    function save(blob: Blob, fileName: string): void {
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = safeDocumentName(fileName)
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        downloads.set(
            url,
            setTimeout(() => {
                URL.revokeObjectURL(url)
                downloads.delete(url)
            }, 30000),
        )
    }
    async function open(document: DocumentReference, mode: 'preview' | 'download'): Promise<void> {
        if (pendingId.value || !allowed()) return
        const request = new AbortController()
        active = request
        pendingId.value = document.id
        error.value = ''
        try {
            const content = await api.download(document.id, request.signal)
            if (request.signal.aborted) return
            if (mode === 'download') {
                save(content.blob, content.fileName)
                return
            }
            if (!documentMimeTypes.some((mime) => mime === document.mimeType))
                throw new ApiError('unexpected')
            const blob = content.blob.slice(0, content.blob.size, document.mimeType)
            await validateDocumentSignature(blob)
            if (request.signal.aborted) return
            close()
            preview.value = { document, url: URL.createObjectURL(blob) }
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `documents.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pendingId.value = ''
        }
    }
    watch([identity, allowed, () => store.user], cleanup, { flush: 'sync' })
    onScopeDispose(cleanup)
    return { pendingId, error, preview, open, close }
}
