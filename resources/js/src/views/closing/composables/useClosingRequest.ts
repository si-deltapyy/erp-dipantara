import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import type { Closing, ClosingEligibility, ClosingInput } from '@/core/types/closing'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { useClosingRecoveryStore } from '@/stores/closing-recovery'
import { ApiError } from '@/core/types/api-error'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { useClosingApi } from './useClosingApi'
export function useClosingRequest(
    initial: ClosingEligibility,
    saved: (closing: Closing) => void,
): ReturnType<typeof createRequestState> {
    return createRequestState(initial, saved)
}
function createRequestState(initial: ClosingEligibility, saved: (closing: Closing) => void) {
    const api = useClosingApi()
    const store = useSessionStore()
    const session = useSession()
    const recovery = useClosingRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate &&
        candidate.actorId === actorId &&
        candidate.draft.purchaseOrderId === initial.purchaseOrderId
            ? candidate
            : null
    recovery.$reset()
    const eligibility = shallowRef(initial)
    const refreshing = ref(false)
    let refreshRequest: AbortController | undefined
    let completed: Closing | undefined
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            !!store.user?.permissions.includes('closings.request.all'),
    )
    const form = useMasterForm<ClosingInput>({
        resource: 'closings',
        initial: {
            purchaseOrderId: initial.purchaseOrderId,
            version: initial.version,
            snapshotToken: initial.snapshotToken,
            notes: null,
        },
        snapshot,
        validate: (input) =>
            input.notes && [...input.notes].length > 2000 ? { notes: 'closings.invalid' } : {},
        write: async (input, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed = await api.create(input, { signal, idempotencyKey })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { draft, idempotencyKey, actorId }
        },
        saved: () => {
            if (completed) saved(completed)
        },
    })
    async function refresh(): Promise<void> {
        if (refreshing.value || form.pending.value || form.uncertain.value) return
        const request = new AbortController()
        refreshRequest = request
        refreshing.value = true
        try {
            const latest = await api.eligibility(initial.purchaseOrderId, request.signal)
            if (request.signal.aborted || store.user?.id !== actorId) return
            eligibility.value = latest
            form.draft.value = {
                ...form.draft.value,
                version: latest.version,
                snapshotToken: latest.snapshotToken,
            }
            form.error.value = ''
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            form.error.value = `closings.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            refreshing.value = false
        }
    }
    onScopeDispose(() => refreshRequest?.abort())
    return { ...form, eligibility, refreshing, permitted, refresh }
}
