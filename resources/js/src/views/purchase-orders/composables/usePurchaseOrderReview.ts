import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { PurchaseOrder, PurchaseOrderReviewAction } from '@/core/types/purchase-order'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import type { PurchaseOrderReviewRecovery } from '@/stores/purchase-order-recovery'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'

interface PurchaseOrderReviewState {
    action: Ref<PurchaseOrderReviewAction | undefined>
    reason: Ref<string>
    reasonError: Ref<string>
    error: Ref<string>
    pending: Ref<boolean>
    uncertain: Ref<boolean>
    blocked: Ref<boolean>
    canApprove: ComputedRef<boolean>
    canReject: ComputedRef<boolean>
    open(action: PurchaseOrderReviewAction): void
    close(): void
    submit(): Promise<void>
    reload(): Promise<void>
}

export function usePurchaseOrderReview(
    order: Ref<PurchaseOrder | undefined>,
    refresh: () => Promise<void>,
    orderId: () => unknown,
): PurchaseOrderReviewState {
    const api = usePurchaseOrderApi()
    const store = useSessionStore()
    const session = useSession()
    const recovery = usePurchaseOrderRecoveryStore()
    const action = ref<PurchaseOrderReviewAction>()
    const reason = ref('')
    const reasonError = ref('')
    const error = ref('')
    const pending = ref(false)
    const uncertain = ref(false)
    const blocked = ref(false)
    let active: AbortController | undefined
    let attempt: PurchaseOrderReviewRecovery | undefined
    let currentId = order.value?.id
    const canApprove = computed(
        () => !!order.value && canActOnPurchaseOrder(store.user, order.value, 'approve'),
    )
    const canReject = computed(
        () => !!order.value && canActOnPurchaseOrder(store.user, order.value, 'reject'),
    )
    function reset(): void {
        active?.abort()
        active = undefined
        attempt = undefined
        action.value = undefined
        reason.value = ''
        reasonError.value = ''
        error.value = ''
        pending.value = false
        uncertain.value = false
        blocked.value = false
    }
    watch([() => store.user, orderId], () => reset(), { flush: 'sync' })
    watch(
        order,
        (current) => {
            if (!current) {
                active?.abort()
                pending.value = false
                return
            }
            if (currentId && currentId !== current.id) reset()
            currentId = current.id
            const snapshot = recovery.review
            if (
                snapshot &&
                snapshot.actorId === store.user?.id &&
                snapshot.order.id === current.id
            ) {
                attempt = snapshot
                reason.value = snapshot.reason
                action.value = snapshot.action
                error.value = 'purchase-orders.reviewCsrf'
                recovery.review = null
            }
        },
        { immediate: true, flush: 'sync' },
    )
    function open(next: PurchaseOrderReviewAction): void {
        if (pending.value || blocked.value || (uncertain.value && attempt?.action !== next)) return
        if (!(next === 'approve' ? canApprove.value : canReject.value)) return
        action.value = next
        reasonError.value = ''
    }
    function close(): void {
        if (pending.value || uncertain.value) return
        action.value = undefined
        reason.value = ''
        reasonError.value = ''
    }
    async function reload(): Promise<void> {
        if (pending.value) return
        action.value = undefined
        const actor = store.user
        const id = orderId()
        await refresh()
        if (!order.value || actor !== store.user || id !== orderId()) return
        if (order.value.status !== 'submitted') return reset()
        attempt = undefined
        uncertain.value = false
        blocked.value = false
        error.value = ''
    }
    async function submit(): Promise<void> {
        const current = order.value
        const selected = action.value
        if (!current || !selected || !store.user || pending.value || blocked.value) return
        if (!(selected === 'approve' ? canApprove.value : canReject.value)) return
        const trimmed = reason.value.trim()
        if (selected === 'reject' && (!trimmed || [...trimmed].length > 2000)) {
            reasonError.value = 'purchase-orders.reasonInvalid'
            return
        }
        if (
            !uncertain.value &&
            (!attempt ||
                attempt.order.version !== current.version ||
                attempt.action !== selected ||
                attempt.reason !== trimmed)
        )
            attempt = {
                actorId: store.user.id,
                order: current,
                action: selected,
                reason: trimmed,
                idempotencyKey: crypto.randomUUID(),
            }
        if (!attempt) return
        const snapshot = attempt
        const request = new AbortController()
        active = request
        pending.value = true
        error.value = ''
        reasonError.value = ''
        try {
            const options = {
                signal: request.signal,
                idempotencyKey: snapshot.idempotencyKey,
                snapshotGeneration: snapshot.order.snapshotGeneration,
            }
            const result =
                snapshot.action === 'approve'
                    ? await api.approve(
                          snapshot.order.id,
                          { version: snapshot.order.version },
                          options,
                      )
                    : await api.reject(
                          snapshot.order.id,
                          { version: snapshot.order.version, reason: snapshot.reason },
                          options,
                      )
            if (request.signal.aborted) return
            order.value = result
            reset()
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value = `purchase-orders.errors.${failure.kind}`
            uncertain.value = failure.kind === 'network' || failure.kind === 'unexpected'
            blocked.value = ['conflict', 'forbidden', 'not-found'].includes(failure.kind)
            if (failure.kind === 'validation' && failure.fieldErrors.reason)
                reasonError.value = 'purchase-orders.reasonInvalid'
            if (failure.kind === 'csrf') recovery.review = snapshot
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pending.value = false
        }
    }
    onScopeDispose(() => active?.abort())
    return {
        action,
        reason,
        reasonError,
        error,
        pending,
        uncertain,
        blocked,
        canApprove,
        canReject,
        open,
        close,
        submit,
        reload,
    }
}
