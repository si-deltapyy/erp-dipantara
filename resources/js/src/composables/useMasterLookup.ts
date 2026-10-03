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
    const visibleCount = ref(20)
    const appliedSearch = ref('')
    const resource = {
        buyer: 'buyers',
        timber: 'timber-products',
        mitra: 'mitras',
        grader: 'graders',
    }[kind]
    const choices = shallowRef<readonly { id: string; label: string }[]>([])
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function load(reset = true): Promise<void> {
        active?.abort()
        loading.value = false
        error.value = ''
        if (
            !store.user?.permissions.includes(`${resource}.read.all`) ||
            (kind === 'timber' && !store.user.permissions.includes('timber-prices.read.all'))
        ) {
            choices.value = []
            error.value = 'ui.scopeUnavailable'
            return
        }
        if (!reset) {
            visibleCount.value += 20
            return
        }
        choices.value = []
        visibleCount.value = 20
        appliedSearch.value = search.value.trim().toLocaleLowerCase('id-ID')
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const response = await api.list(
                { page: 1, perPage: 20, search: '', sort: 'createdAt' },
                request.signal,
            )
            if (request.signal.aborted) return
            choices.value = response.map((record) => ({
                id: record.id,
                label: 'companyName' in record ? record.companyName : record.name,
            }))
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `purchase-orders.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    const filtered = computed(() =>
        choices.value.filter((choice) =>
            choice.label.toLocaleLowerCase('id-ID').includes(appliedSearch.value),
        ),
    )
    const options = computed(() => {
        const combined = new Map(
            filtered.value.slice(0, visibleCount.value).map((choice) => [choice.id, choice.label]),
        )
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
        hasMore: computed(() => visibleCount.value < filtered.value.length),
    }
}
