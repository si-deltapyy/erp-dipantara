import { mitrasApiKey } from '@/api/mitras-api'
import { gradersApiKey } from '@/api/graders-api'
import type { ComputedRef } from 'vue'
import { inject, ref, shallowRef, onScopeDispose, watch, computed } from 'vue'
import type { Ref } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'

interface MasterLookupState {
    search: Ref<string>
    options: ComputedRef<{ value: string; label: string }[]>
    loading: Ref<boolean>
    error: Ref<string>
    hasMore: ComputedRef<boolean>
    load(reset?: boolean): Promise<void>
}

export function useMasterLookup(
    kind: 'buyer' | 'timber' | 'mitra' | 'grader',
    selected: Readonly<Ref<{ id: string; label: string }>>,
): MasterLookupState {
    const buyers = inject(buyersApiKey)
    const timber = inject(timberProductsApiKey)
    if (!buyers || !timber) throw new Error('Master lookup APIs are not configured')
    const mitras = inject(mitrasApiKey)
    const graders = inject(gradersApiKey)
    const selectedApi =
        kind === 'buyer' ? buyers : kind === 'timber' ? timber : kind === 'mitra' ? mitras : graders
    if (!selectedApi) throw new Error('Master lookup API is not configured')
    const api = selectedApi
    const session = useSession()
    const store = useSessionStore()
    const search = ref('')
    const page = ref(1)
    const total = ref(0)
    const choices = shallowRef<readonly { id: string; label: string }[]>([])
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function load(reset = true): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        const next = reset ? 1 : page.value + 1
        loading.value = true
        error.value = ''
        try {
            const response = await api.lookup(
                { page: next, perPage: 20, search: search.value.trim(), sort: 'createdAt' },
                request.signal,
            )
            if (request.signal.aborted) return
            choices.value = reset ? response.data : [...choices.value, ...response.data]
            page.value = next
            total.value = response.meta.total
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `purchase-orders.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    const options = computed(() => {
        const combined = new Map(choices.value.map((choice) => [choice.id, choice.label]))
        if (selected.value.id && !combined.has(selected.value.id))
            combined.set(selected.value.id, selected.value.label || selected.value.id)
        return [...combined].map(([value, label]) => ({ value, label }))
    })
    watch(
        () => store.user,
        () => {
            choices.value = []
            void load()
        },
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return {
        search,
        options,
        loading,
        error,
        load,
        hasMore: computed(() => page.value * 20 < total.value),
    }
}
