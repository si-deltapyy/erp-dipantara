import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MasterListQuery } from '@/core/types/master-list'
import type { PageResponse } from '@/core/types/contracts'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

interface MasterListState<T> {
    readonly response: ShallowRef<PageResponse<T> | undefined>
    readonly query: ComputedRef<MasterListQuery>
    readonly search: Ref<string>
    readonly loading: Ref<boolean>
    readonly error: Ref<string>
    readonly canCreate: ComputedRef<boolean>
    refresh(): Promise<void>
    searchRecords(): Promise<void>
    changePage(page: number): Promise<void>
}
interface MasterListSource<T> {
    list(query: MasterListQuery, signal: AbortSignal): Promise<PageResponse<T>>
    subscribe(listener: () => void): () => void
}
export function useMasterList<T>(api: MasterListSource<T>, resource: string): MasterListState<T> {
    const session = useSession()
    const store = useSessionStore()
    const route = useRoute()
    const router = useRouter()
    const query = computed<MasterListQuery>(() => ({
        page: validPage(route.query.page),
        perPage: 20,
        search: typeof route.query.search === 'string' ? route.query.search.slice(0, 200) : '',
        sort: '-createdAt',
    }))
    const search = ref(query.value.search)
    const response = shallowRef<PageResponse<T>>()
    const loading = ref(false)
    const error = ref('')
    const canCreate = computed(() => !!store.user?.permissions.includes(`${resource}.create.all`))
    let current: AbortController | undefined
    async function refresh(): Promise<void> {
        current?.abort()
        const request = new AbortController()
        current = request
        loading.value = true
        error.value = ''
        try {
            const result = await api.list(query.value, request.signal)
            if (request.signal.aborted) return
            const lastPage = Math.max(1, Math.ceil(result.meta.total / result.meta.perPage))
            if (query.value.page > lastPage) {
                await changePage(lastPage)
                return
            }
            response.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            response.value = undefined
            error.value = `${resource}.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (current === request) loading.value = false
        }
    }
    async function changePage(page: number): Promise<void> {
        await router.replace({ query: { ...route.query, page: page === 1 ? undefined : page } })
    }
    async function searchRecords(): Promise<void> {
        await router.replace({ query: { search: search.value.trim() || undefined } })
    }
    watch(
        () => [query.value.page, query.value.search, store.user],
        () => {
            search.value = query.value.search
            void refresh()
        },
        { immediate: true },
    )
    const unsubscribe = api.subscribe(() => void refresh())
    onScopeDispose(() => {
        current?.abort()
        unsubscribe()
    })
    return {
        response,
        query,
        search,
        loading,
        error,
        canCreate,
        refresh,
        searchRecords,
        changePage,
    }
}
function validPage(value: unknown): number {
    const page = typeof value === 'string' ? Number(value) : 1
    return Number.isSafeInteger(page) && page > 0 ? page : 1
}
