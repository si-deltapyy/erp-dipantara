import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { Grading } from '@/core/types/grading'
import { useGradingApi } from './useGradingApi'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
export function useGradingRevisionSource(record: () => Grading): {
    parent: ShallowRef<Grading | undefined>
    error: Ref<string>
    loading: Ref<boolean>
    refresh(): Promise<void>
} {
    const api = useGradingApi(),
        session = useSession(),
        store = useSessionStore()
    const parent = shallowRef<Grading>(),
        error = ref(''),
        loading = ref(false)
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        parent.value = undefined
        error.value = ''
        loading.value = false
        const id = record().revisionOfId
        if (!id) return
        const request = new AbortController()
        active = request
        loading.value = true
        try {
            const result = await api.get(id, request.signal)
            if (!request.signal.aborted) parent.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `gradings.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [record().id, record().version, store.user],
        () => void refresh(),
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return { parent, error, loading, refresh }
}
