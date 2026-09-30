import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { AvailableTimber } from '@/core/types/delivery'
import { useSession } from '@/composables/useSession'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { useDeliveryApi } from './useDeliveryApi'
interface AvailabilityState {
    rows: ShallowRef<readonly AvailableTimber[]>
    loading: Ref<boolean>
    error: Ref<string>
    page: Ref<number>
    total: Ref<number>
    refresh(): Promise<void>
    changePage(page: number): void
}
export function useDeliveryAvailability(
    purchaseOrderId: () => string,
    deliveryId: string | undefined,
    loaded: (rows: readonly AvailableTimber[]) => void,
): AvailabilityState {
    const api = useDeliveryApi()
    const session = useSession()
    const rows = shallowRef<readonly AvailableTimber[]>([])
    const loading = ref(false)
    const error = ref('')
    const page = ref(1)
    const total = ref(0)
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        rows.value = []
        total.value = 0
        loading.value = false
        error.value = ''
        if (!purchaseOrderId()) return
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const response = await api.availability(
                {
                    page: page.value,
                    perPage: 20,
                    search: '',
                    sort: 'createdAt',
                    purchaseOrderId: purchaseOrderId(),
                    excludeDeliveryId: deliveryId,
                },
                request.signal,
            )
            if (request.signal.aborted) return
            rows.value = response.data
            total.value = response.meta.total
            loaded(response.data)
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `deliveries.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        purchaseOrderId,
        () => {
            page.value = 1
            void refresh()
        },
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return {
        rows,
        loading,
        error,
        page,
        total,
        refresh,
        changePage: (next) => {
            page.value = next
            void refresh()
        },
    }
}
