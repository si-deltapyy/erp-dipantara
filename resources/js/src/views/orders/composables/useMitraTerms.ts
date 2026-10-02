import { inject, ref, shallowRef, watch, onScopeDispose } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { Invoice } from '@/core/types/invoice'
import { invoicesApiKey } from '@/api/invoices-api'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
interface MitraTermsState {
    invoices: ShallowRef<readonly Invoice[]>
    error: Ref<string>
    loading: Ref<boolean>
    hasMore: Ref<boolean>
    load(more?: boolean): Promise<void>
}
export function useMitraTerms(
    parent: Readonly<Ref<{ purchaseOrderId: string; mitraId: string }>>,
): MitraTermsState {
    const injected = inject(invoicesApiKey)
    if (!injected) throw new Error('Invoices API is not configured')
    const api = injected
    const store = useSessionStore()
    const session = useSession()
    const invoices = shallowRef<readonly Invoice[]>([])
    const error = ref(''),
        loading = ref(false),
        hasMore = ref(false)
    let active: AbortController | undefined
    let page = 1
    async function load(more = false): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        const next = more ? page + 1 : 1
        try {
            const response = await api.list(
                {
                    ...parent.value,
                    direction: 'payable',
                    page: next,
                    perPage: 20,
                    search: '',
                    sort: 'createdAt',
                },
                request.signal,
            )
            if (request.signal.aborted) return
            invoices.value = more ? [...invoices.value, ...response.data] : response.data
            page = next
            hasMore.value = next * 20 < response.meta.total
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `assignments.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [parent.value, store.user],
        () => {
            invoices.value = []
            void load()
        },
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return { invoices, error, loading, hasMore, load }
}
