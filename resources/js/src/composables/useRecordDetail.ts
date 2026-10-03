import type { Ref, ShallowRef } from 'vue'
import { onScopeDispose, shallowRef, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'

interface RecordDetailState<T> {
    record: ShallowRef<T | undefined>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
}

export function useRecordDetail<T>(
    api: {
        get(id: string, signal: AbortSignal): Promise<T>
        subscribe(listener: () => void): () => void
    },
    resource: string,
    observeChanges = true,
    identity?: () => string | undefined,
): RecordDetailState<T> {
    const route = useRoute()
    const session = useSession()
    const store = useSessionStore()
    const record = shallowRef<T>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const id = identity ? identity() : route.params.id
        record.value = undefined
        loading.value = false
        error.value = ''
        if (!store.user || typeof id !== 'string') return
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const result = await api.get(id, request.signal)
            if (!request.signal.aborted) record.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value =
                failure.code === 'record.unconfirmed'
                    ? 'ui.recordUnavailable'
                    : failure.code === 'feature.unavailable'
                      ? 'ui.featureUnavailable'
                      : `${resource}.errors.${failure.kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [identity ? identity() : route.params.id, store.user],
        () => void refresh(),
        { immediate: true },
    )
    const unsubscribe = observeChanges ? api.subscribe(() => void refresh()) : () => undefined
    onScopeDispose(() => {
        active?.abort()
        unsubscribe()
    })
    return { record, loading, error, refresh }
}
