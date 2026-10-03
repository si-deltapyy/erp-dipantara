import type { Ref, ShallowRef, ComputedRef } from 'vue'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { OrderRecord, OrderQuery } from '@/core/types/order'
import { orderStatuses } from '@/core/types/order'
import type { PageResponse } from '@/core/types/contracts'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { canCreateOrder } from '@/core/domain/order-policy'
import { useOrderApi } from './useOrderApi'

interface OrderListState {
    response: ShallowRef<PageResponse<OrderRecord> | undefined>
    query: ComputedRef<OrderQuery>
    search: Ref<string>
    status: Ref<string>
    purchaseOrderId: Ref<string>
    sort: Ref<string>
    loading: Ref<boolean>
    error: Ref<string>
    canReview: ComputedRef<boolean>
    canCreate: ComputedRef<boolean>
    refresh(): Promise<void>
    changePage(page: number): Promise<void>
    applyFilters(): Promise<void>
}

export function useOrderList(): OrderListState {
    const api = useOrderApi()
    const session = useSession()
    const store = useSessionStore()
    const route = useRoute()
    const router = useRouter()
    const query = computed<OrderQuery>(() => ({
        page: pageNumber(route.query.page),
        perPage: 20,
        search: typeof route.query.search === 'string' ? route.query.search.slice(0, 200) : '',
        sort: route.query.sort === 'createdAt' ? 'createdAt' : '-createdAt',
        status: orderStatuses.find((status) => status === route.query.status),
        purchaseOrderId:
            typeof route.query.purchaseOrderId === 'string' &&
            route.query.purchaseOrderId.length <= 100
                ? route.query.purchaseOrderId
                : undefined,
    }))
    const search = ref(query.value.search)
    const status = ref(query.value.status ?? '')
    const purchaseOrderId = ref(query.value.purchaseOrderId ?? '')
    const sort = ref(query.value.sort)
    const response = shallowRef<PageResponse<OrderRecord>>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        response.value = undefined
        loading.value = true
        error.value = ''
        try {
            const result = await api.list(query.value, request.signal)
            if (request.signal.aborted) return
            const last = Math.max(1, Math.ceil(result.meta.total / result.meta.perPage))
            if (query.value.page > last) {
                await changePage(last)
                return
            }
            response.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `orders.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    async function changePage(page: number): Promise<void> {
        await router.replace({ query: { ...route.query, page: page === 1 ? undefined : page } })
    }
    async function applyFilters(): Promise<void> {
        await router.replace({
            query: {
                search: search.value.trim() || undefined,
                status: status.value || undefined,
                purchaseOrderId: purchaseOrderId.value || undefined,
                sort: sort.value,
            },
        })
    }
    watch(
        () => [query.value, store.user],
        () => {
            search.value = query.value.search
            status.value = query.value.status ?? ''
            purchaseOrderId.value = query.value.purchaseOrderId ?? ''
            sort.value = query.value.sort
            void refresh()
        },
        { immediate: true },
    )
    const unsubscribe = api.subscribe(() => void refresh())
    onScopeDispose(() => {
        active?.abort()
        unsubscribe()
    })
    return {
        response,
        query,
        search,
        status,
        purchaseOrderId,
        sort,
        loading,
        error,
        refresh,
        changePage,
        applyFilters,
        canReview: computed(
            () =>
                hasBusinessPermission(store.user, 'orders.approve') ||
                hasBusinessPermission(store.user, 'orders.reject'),
        ),
        canCreate: computed(() => canCreateOrder(store.user)),
    }
}
function pageNumber(value: unknown): number {
    const page = typeof value === 'string' ? Number(value) : 1
    return Number.isSafeInteger(page) && page > 0 ? page : 1
}
