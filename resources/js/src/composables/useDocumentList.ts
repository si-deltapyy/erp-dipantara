import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { DocumentParent, DocumentReference } from '@/core/types/document'
import { useSession } from './useSession'
import { useSessionStore } from '@/stores/session'
import { useDocumentsApi } from './useDocumentsApi'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

interface DocumentListState {
    documents: Ref<readonly DocumentReference[]>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
}
export function useDocumentList(parent: () => DocumentParent | undefined): DocumentListState {
    const api = useDocumentsApi()
    const session = useSession()
    const store = useSessionStore()
    const documents = shallowRef<readonly DocumentReference[]>([])
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const target = parent()
        documents.value = []
        error.value = ''
        loading.value = false
        if (!target) return
        const request = new AbortController()
        active = request
        loading.value = true
        try {
            const response = await api.list(target, request.signal)
            if (!request.signal.aborted) documents.value = response
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `documents.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch([parent, () => store.user], () => void refresh(), { immediate: true })
    const unsubscribe = api.subscribe(() => void refresh())
    onScopeDispose(() => {
        active?.abort()
        unsubscribe()
    })
    return { documents, loading, error, refresh }
}
