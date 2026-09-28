import type { Ref, ShallowRef } from 'vue'
import { onScopeDispose, shallowRef, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Delivery } from '@/core/types/delivery'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { useDeliveryApi } from './useDeliveryApi'

interface DeliveryDetailState {
    delivery: ShallowRef<Delivery | undefined>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
}

export function useDeliveryDetail(): DeliveryDetailState {
    const api = useDeliveryApi()
    const route = useRoute()
    const session = useSession()
    const store = useSessionStore()
    const delivery = shallowRef<Delivery>()
    const loading = ref(false)
    const error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const id = route.params.id
        delivery.value = undefined
        if (typeof id !== 'string') return
        const request = new AbortController()
        active = request
        loading.value = true
        error.value = ''
        try {
            const result = await api.get(id, request.signal)
            if (!request.signal.aborted) delivery.value = result
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `deliveries.errors.${normalizeApiError(cause).kind}`
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
    return { delivery, loading, error, refresh }
}
