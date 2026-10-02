import type { BankAccountOwnerType } from '@/core/types/bank-account'
import type { ComputedRef } from 'vue'
import { inject, ref, shallowRef, onScopeDispose, watch, computed } from 'vue'
import type { Ref } from 'vue'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'

interface PaymentAccountLookupState {
    search: Ref<string>
    options: ComputedRef<{ value: string; label: string }[]>
    loading: Ref<boolean>
    error: Ref<string>
    hasMore: ComputedRef<boolean>
    load(reset?: boolean): Promise<void>
}

export function usePaymentAccountLookup(
    selected: Readonly<Ref<{ id: string; label: string }>>,
    context: () => { invoiceId: string; ownerType: BankAccountOwnerType },
): PaymentAccountLookupState {
    const injected = inject(bankAccountsApiKey)
    if (!injected) throw new Error('Bank accounts API is not configured')
    const api = injected
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
                {
                    page: next,
                    perPage: 20,
                    search: search.value.trim(),
                    sort: 'createdAt',
                    ...context(),
                },
                request.signal,
            )
            if (request.signal.aborted) return
            const entries = response.data.map((order) => ({
                id: order.id,
                label: order.label,
            }))
            choices.value = reset ? entries : [...choices.value, ...entries]
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
        [() => store.user, context],
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
