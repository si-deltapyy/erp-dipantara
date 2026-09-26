import type { ComputedRef } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { purchaseOrderDraft } from '@/core/domain/purchase-order-draft'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'

interface PurchaseOrderSubmitState {
    pending: Ref<boolean>
    confirming: Ref<boolean>
    error: Ref<string>
    uncertain: Ref<boolean>
    canSubmit: ComputedRef<boolean>
    submit(): Promise<void>
}

export function usePurchaseOrderSubmit(
    order: Ref<PurchaseOrder | undefined>,
): PurchaseOrderSubmitState {
    const api = usePurchaseOrderApi()
    const store = useSessionStore()
    const session = useSession()
    const recovery = usePurchaseOrderRecoveryStore()
    const pending = ref(false)
    const confirming = ref(false)
    const error = ref('')
    const uncertain = ref(false)
    let identity = ''
    let key: string = crypto.randomUUID()
    let active: AbortController | undefined
    const canSubmit = computed(
        () => !!order.value && canActOnPurchaseOrder(store.user, order.value, 'submit'),
    )
    watch([() => store.user?.id, () => order.value?.id], () => {
        active?.abort()
        active = undefined
        identity = ''
        key = crypto.randomUUID()
        pending.value = false
        confirming.value = false
        error.value = ''
        uncertain.value = false
    })
    watch(order, (current) => {
        const snapshot = recovery.snapshot
        if (
            current &&
            snapshot &&
            snapshot.actorId === store.user?.id &&
            snapshot.action === 'submit' &&
            snapshot.order?.id === current.id
        ) {
            key = snapshot.idempotencyKey
            identity = `${store.user?.id}:${current.id}:${snapshot.order.version}`
            error.value = 'purchase-orders.errors.csrf'
            recovery.$reset()
        }
    })
    async function submit(): Promise<void> {
        const current = order.value
        if (!current || pending.value || !canSubmit.value) return
        const next = `${store.user?.id}:${current.id}:${current.version}`
        if (identity && next !== identity) key = crypto.randomUUID()
        identity = next
        active = new AbortController()
        const request = active
        pending.value = true
        confirming.value = false
        error.value = ''
        try {
            const result = await api.submit(
                current.id,
                { version: current.version },
                {
                    signal: request.signal,
                    idempotencyKey: key,
                    snapshotGeneration: current.snapshotGeneration,
                },
            )
            if (!request.signal.aborted) {
                order.value = result
                uncertain.value = false
            }
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value = `purchase-orders.errors.${failure.kind}`
            uncertain.value = failure.kind === 'network'
            if (failure.kind === 'csrf' && store.user)
                recovery.snapshot = {
                    actorId: store.user.id,
                    action: 'submit',
                    order: current,
                    draft: purchaseOrderDraft(current),
                    idempotencyKey: key,
                }
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pending.value = false
        }
    }
    onScopeDispose(() => active?.abort())
    return { pending, confirming, error, uncertain, canSubmit, submit }
}
