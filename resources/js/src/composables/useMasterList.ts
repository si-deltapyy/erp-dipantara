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
    list(query: MasterListQuery, signal: AbortSignal): Promise<PageResponse<T> | readonly T[]>
    subscribe(listener: () => void): () => void
}
interface CollectionDisplay<T> {
    searchText(record: T): string
    compare(left: T, right: T): number
}
export function useMasterList<T>(
    api: MasterListSource<T>,
    resource: string,
    filters: () => Record<string, string | undefined> = () => ({}),
    collection?: CollectionDisplay<T>,
    requiredPermission?: string,
): MasterListState<T> {
    const session = useSession()
    const store = useSessionStore()
    const route = useRoute()
    const router = useRouter()
    const query = computed<MasterListQuery>(() => ({
        ...filters(),
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
        response.value = undefined
        error.value = ''
        loading.value = false
        if (!store.user) return
        if (requiredPermission && !store.user.permissions.includes(requiredPermission)) {
            error.value = 'ui.scopeUnavailable'
            return
        }
        const request = new AbortController()
        current = request
        loading.value = true
        error.value = ''
        try {
            const records = await api.list(query.value, request.signal)
            if (request.signal.aborted) return
            const result =
                'meta' in records ? records : paginateCollection(records, query.value, collection)
            const lastPage = Math.max(1, Math.ceil(result.meta.total / result.meta.perPage))
            if (query.value.page > lastPage) {
                await changePage(lastPage)
                return
            }
            response.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            response.value = undefined
            const failure = normalizeApiError(cause)
            error.value =
                failure.code === 'record.unconfirmed'
                    ? 'ui.recordUnavailable'
                    : failure.code === 'feature.unavailable'
                      ? 'ui.featureUnavailable'
                      : `${resource}.errors.${failure.kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (current === request) loading.value = false
        }
    }
    async function changePage(page: number): Promise<void> {
        await router.replace({ query: { ...route.query, page: page === 1 ? undefined : page } })
    }
    async function searchRecords(): Promise<void> {
        await router.replace({
            query: { ...route.query, page: undefined, search: search.value.trim() || undefined },
        })
    }
    watch(
        () => [query.value, store.user],
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
function paginateCollection<T>(
    records: readonly T[],
    query: MasterListQuery,
    display: CollectionDisplay<T> | undefined,
): PageResponse<T> {
    if (!display) throw new Error('Collection display is not configured')
    const search = query.search.trim().toLocaleLowerCase('id-ID')
    const filtered = records.filter((record) =>
        display.searchText(record).toLocaleLowerCase('id-ID').includes(search),
    )
    filtered.sort((left, right) =>
        query.sort === '-createdAt' ? display.compare(right, left) : display.compare(left, right),
    )
    const offset = (query.page - 1) * query.perPage
    return {
        data: filtered.slice(offset, offset + query.perPage),
        meta: { page: query.page, perPage: query.perPage, total: filtered.length },
    }
}
function validPage(value: unknown): number {
    const page = typeof value === 'string' ? Number(value) : 1
    return Number.isSafeInteger(page) && page > 0 ? page : 1
}
