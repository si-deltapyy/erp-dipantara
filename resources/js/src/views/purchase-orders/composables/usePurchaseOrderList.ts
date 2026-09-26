import type { Ref, ShallowRef, ComputedRef } from 'vue'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PurchaseOrder, PurchaseOrderQuery } from '@/core/types/purchase-order'
import { purchaseOrderStatuses } from '@/core/types/purchase-order'
import type { PageResponse } from '@/core/types/contracts'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { canCreatePurchaseOrder } from '@/core/domain/purchase-order-policy'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'

interface PurchaseOrderListState {
    response: ShallowRef<PageResponse<PurchaseOrder> | undefined>
    query: ComputedRef<PurchaseOrderQuery>
    search: Ref<string>
    status: Ref<string>
    buyerId: Ref<string>
    sort: Ref<string>
    loading: Ref<boolean>
    error: Ref<string>
    canCreate: ComputedRef<boolean>
    refresh(): Promise<void>
    changePage(page: number): Promise<void>
    applyFilters(): Promise<void>
}

export function usePurchaseOrderList(): PurchaseOrderListState {
    const api = usePurchaseOrderApi()
    const session = useSession()
    const store = useSessionStore()
    const route = useRoute()
    const router = useRouter()
    const query = computed<PurchaseOrderQuery>(() => ({
        page: pageNumber(route.query.page),
        perPage: 20,
        search: typeof route.query.search === 'string' ? route.query.search.slice(0, 200) : '',
        sort: route.query.sort === 'createdAt' ? 'createdAt' : '-createdAt',
        status: purchaseOrderStatuses.find((status) => status === route.query.status),
        buyerId:
            typeof route.query.buyerId === 'string' && route.query.buyerId.length <= 100
                ? route.query.buyerId
                : undefined,
    }))
    const search = ref(query.value.search)
    const status = ref(query.value.status ?? '')
    const buyerId = ref(query.value.buyerId ?? '')
    const sort = ref(query.value.sort)
    const response = shallowRef<PageResponse<PurchaseOrder>>()
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
            error.value = `purchase-orders.errors.${normalizeApiError(cause).kind}`
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
                buyerId: buyerId.value || undefined,
                sort: sort.value,
            },
        })
    }
    watch(
        () => [query.value, store.user],
        () => {
            search.value = query.value.search
            status.value = query.value.status ?? ''
            buyerId.value = query.value.buyerId ?? ''
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
        buyerId,
        sort,
        loading,
        error,
        refresh,
        changePage,
        applyFilters,
        canCreate: computed(() => canCreatePurchaseOrder(store.user)),
    }
}
function pageNumber(value: unknown): number {
    const page = typeof value === 'string' ? Number(value) : 1
    return Number.isSafeInteger(page) && page > 0 ? page : 1
}
