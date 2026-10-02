import { computed, inject, onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref, ComputedRef, ShallowRef } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import { mitrasApiKey } from '@/api/mitras-api'
import type { BankAccountInput } from '@/core/types/bank-account'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { useSessionStore } from '@/stores/session'
import { useBankAccountRecoveryStore } from '@/stores/bank-account-recovery'
import { useSession } from '@/composables/useSession'

interface OwnerChoice {
    readonly value: string
    readonly label: string
}
interface OwnerState {
    search: Ref<string>
    page: Ref<number>
    total: Ref<number>
    loading: Ref<boolean>
    error: Ref<string>
    choices: ShallowRef<readonly OwnerChoice[]>
    hasNext: ComputedRef<boolean>
    refresh(): Promise<void>
    find(): void
    changePage(page: number): void
}
export function useBankAccountOwners(
    input: () => BankAccountInput,
    editing: () => boolean,
): OwnerState {
    const buyers = inject(buyersApiKey)
    const mitras = inject(mitrasApiKey)
    if (!buyers || !mitras) throw new Error('Owner APIs are not configured')
    const session = useSession()
    const store = useSessionStore()
    const recovery = useBankAccountRecoveryStore()
    const ownerApis = { buyer: buyers, mitra: mitras }
    const search = ref('')
    const page = ref(1)
    const total = ref(0)
    const loading = ref(false)
    const error = ref('')
    const choices = shallowRef<readonly OwnerChoice[]>([])
    let request: AbortController | undefined
    async function refresh(): Promise<void> {
        request?.abort()
        const active = new AbortController()
        request = active
        choices.value = []
        total.value = 0
        error.value = ''
        loading.value = false
        if (editing() || input().ownerType === 'company') return
        loading.value = true
        const api = input().ownerType === 'buyer' ? ownerApis.buyer : ownerApis.mitra
        try {
            const result = await api.lookup(
                { page: page.value, perPage: 20, search: search.value, sort: 'createdAt' },
                active.signal,
            )
            if (active.signal.aborted) return
            choices.value = result.data.map((owner) => ({ value: owner.id, label: owner.label }))
            total.value = result.meta.total
        } catch (cause) {
            if (active.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value = `bank-accounts.errors.${failure.kind}`
            if (failure.kind === 'csrf' && store.user)
                recovery.snapshot = {
                    actorId: store.user.id,
                    draft: { ...input() },
                    idempotencyKey: crypto.randomUUID(),
                }
            await session.handleRequestFailure(cause)
        } finally {
            if (request === active) loading.value = false
        }
    }
    watch(
        () => input().ownerType,
        () => {
            search.value = ''
            page.value = 1
            void refresh()
        },
        { immediate: true },
    )
    const stopBuyer = buyers.subscribe(() => {
        if (input().ownerType === 'buyer') void refresh()
    })
    const stopMitra = mitras.subscribe(() => {
        if (input().ownerType === 'mitra') void refresh()
    })
    onScopeDispose(() => {
        request?.abort()
        stopBuyer()
        stopMitra()
    })
    return {
        search,
        page,
        total,
        loading,
        error,
        choices,
        hasNext: computed(() => page.value * 20 < total.value),
        refresh,
        find: () => {
            page.value = 1
            void refresh()
        },
        changePage: (next) => {
            page.value = Math.max(1, next)
            void refresh()
        },
    }
}
