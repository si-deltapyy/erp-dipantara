import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { Invoice } from '@/core/types/invoice'
import { useInvoiceApi } from './useInvoiceApi'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
export function useInvoiceVersions(identity: () => string): {
    versions: ShallowRef<readonly Invoice[]>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
} {
    const api = useInvoiceApi()
    const session = useSession()
    const store = useSessionStore()
    const versions = shallowRef<readonly Invoice[]>([])
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        versions.value = []
        loading.value = true
        error.value = ''
        try {
            const result = await api.versions(identity(), request.signal)
            if (!request.signal.aborted) versions.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `invoices.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [identity(), store.user],
        () => void refresh(),
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return { versions, loading, error, refresh }
}
