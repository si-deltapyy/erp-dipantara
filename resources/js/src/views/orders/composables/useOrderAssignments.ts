import { ref, shallowRef, watch, onScopeDispose, computed } from 'vue'
import type { Ref, ShallowRef, ComputedRef } from 'vue'
import type { Assignment } from '@/core/types/assignment'
import type { Order } from '@/core/types/order'
import type { PageResponse } from '@/core/types/contracts'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { useAssignmentApi } from './useAssignmentApi'
interface AssignmentPanelState {
    response: ShallowRef<PageResponse<Assignment> | undefined>
    page: Ref<number>
    loading: Ref<boolean>
    error: Ref<string>
    canCreate: ComputedRef<boolean>
    refresh(): Promise<void>
}
export function useOrderAssignments(order: Readonly<Ref<Order>>): AssignmentPanelState {
    const api = useAssignmentApi()
    const store = useSessionStore()
    const session = useSession()
    const page = ref(1)
    const response = shallowRef<PageResponse<Assignment>>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        response.value = undefined
        try {
            const result = await api.list(
                {
                    page: page.value,
                    perPage: 20,
                    sort: 'createdAt',
                    search: '',
                    orderId: order.value.id,
                },
                request.signal,
            )
            if (!request.signal.aborted) response.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `assignments.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [order.value.id, page.value, store.user],
        () => void refresh(),
        { immediate: true },
    )
    const stop = api.subscribe(() => void refresh())
    onScopeDispose(() => {
        active?.abort()
        stop()
    })
    return {
        response,
        page,
        loading,
        error,
        refresh,
        canCreate: computed(
            () =>
                ['draft', 'rejected'].includes(order.value.status) &&
                hasBusinessPermission(store.user, 'assignments.create') &&
                hasBusinessPermission(store.user, 'orders.update'),
        ),
    }
}
