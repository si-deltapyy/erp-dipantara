import type { Ref, ShallowRef } from 'vue'
import { onScopeDispose, shallowRef, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Order } from '@/core/types/order'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { useOrderApi } from './useOrderApi'

interface OrderDetailState {
    order: ShallowRef<Order | undefined>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
}

export function useOrderDetail(): OrderDetailState {
    const api = useOrderApi()
    const route = useRoute()
    const session = useSession()
    const store = useSessionStore()
    const order = shallowRef<Order>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const id = route.params.id
        order.value = undefined
        if (typeof id !== 'string') return
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const result = await api.get(id, request.signal)
            if (!request.signal.aborted) order.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `orders.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [route.params.id, store.user],
        () => void refresh(),
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    return { order, loading, error, refresh }
}
