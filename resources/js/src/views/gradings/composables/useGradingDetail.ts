import type { Ref, ShallowRef } from 'vue'
import { onScopeDispose, shallowRef, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Grading } from '@/core/types/grading'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { useGradingApi } from './useGradingApi'

interface GradingDetailState {
    grading: ShallowRef<Grading | undefined>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
}

export function useGradingDetail(): GradingDetailState {
    const api = useGradingApi()
    const route = useRoute()
    const session = useSession()
    const store = useSessionStore()
    const grading = shallowRef<Grading>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const id = route.params.id
        grading.value = undefined
        if (typeof id !== 'string') return
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const result = await api.get(id, request.signal)
            if (!request.signal.aborted) grading.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `gradings.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [route.params.id, store.user],
        () => void refresh(),
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return { grading, loading, error, refresh }
}
