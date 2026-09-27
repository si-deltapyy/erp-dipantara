import { effectScope, shallowRef, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { usePurchaseOrderReview } from './usePurchaseOrderReview'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { purchaseOrderFixtures } from '@/api/mocks/purchase-order-fixtures'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import type { PurchaseOrder, PurchaseOrdersApi } from '@/core/types/purchase-order'
import { ApiError } from '@/core/types/api-error'
const { approve, reject, handleRequestFailure } = vi.hoisted(() => ({
    approve: vi.fn<PurchaseOrdersApi['approve']>(),
    reject: vi.fn<PurchaseOrdersApi['reject']>(),
    handleRequestFailure: vi.fn(),
}))
vi.mock('./usePurchaseOrderApi', () => ({ usePurchaseOrderApi: () => ({ approve, reject }) }))
vi.mock('@/composables/useSession', () => ({ useSession: () => ({ handleRequestFailure }) }))
const scopes: ReturnType<typeof effectScope>[] = []
beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'supervisor-demo') ?? null
    vi.clearAllMocks()
})
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
function submitted(index = 1): PurchaseOrder {
    const order = purchaseOrderFixtures[index]
    if (!order) throw new Error('Missing fixture')
    return { ...order, allowedActions: ['approve', 'reject'] }
}
function setup() {
    const scope = effectScope()
    scopes.push(scope)
    const order = shallowRef<PurchaseOrder | undefined>(submitted())
    const selectedId = ref('demo-po-02')
    const refresh = vi.fn(async () => {
        order.value = { ...submitted(), version: 2 }
    })
    const state = scope.run(() => usePurchaseOrderReview(order, refresh, () => selectedId.value))
    if (!state) throw new Error('Missing scope')
    return { order, state, refresh, selectedId }
}
test('validates reasons and preserves draft after field errors without changing status', async () => {
    const { state, order } = setup()
    state.open('reject')
    for (const reason of ['   ', 'x'.repeat(2001)]) {
        state.reason.value = reason
        await state.submit()
        expect(reject).not.toHaveBeenCalled()
        expect(state.reasonError.value).toBe('purchase-orders.reasonInvalid')
    }
    state.reason.value = 'Perbaiki jumlah'
    reject.mockRejectedValueOnce(new ApiError('validation', { reason: ['invalid'] }))
    await state.submit()
    expect(state.reason.value).toBe('Perbaiki jumlah')
    expect(state.reasonError.value).toBe('purchase-orders.reasonInvalid')
    expect(order.value?.status).toBe('submitted')
})
test('locks uncertain writes to the original decision and payload on explicit retry', async () => {
    const { state } = setup()
    state.open('reject')
    state.reason.value = ' Perbaiki jumlah '
    reject.mockRejectedValueOnce(new ApiError('network'))
    await state.submit()
    expect(reject).toHaveBeenCalledTimes(1)
    state.open('approve')
    expect(state.action.value).toBe('reject')
    state.reason.value = 'Attempted changed reason'
    reject.mockResolvedValueOnce({
        ...submitted(),
        status: 'rejected',
        allowedActions: [],
        rejectionReason: 'Perbaiki jumlah',
    })
    await state.submit()
    expect(reject.mock.calls[1]?.[1]).toEqual({ version: 1, reason: 'Perbaiki jumlah' })
    expect(reject.mock.calls[1]?.[2].idempotencyKey).toBe(reject.mock.calls[0]?.[2].idempotencyKey)
    expect(state.reason.value).toBe('')
})
test('requires reread and a new confirmation after conflict while preserving the reason', async () => {
    const { state, refresh } = setup()
    state.open('reject')
    state.reason.value = 'Revisi rincian'
    reject.mockRejectedValueOnce(new ApiError('conflict'))
    await state.submit()
    await state.submit()
    expect(reject).toHaveBeenCalledTimes(1)
    await state.reload()
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(state.action.value).toBeUndefined()
    expect(state.reason.value).toBe('Revisi rincian')
    state.open('reject')
    reject.mockResolvedValueOnce({ ...submitted(), status: 'rejected', allowedActions: [] })
    await state.submit()
    expect(reject.mock.calls[1]?.[1].version).toBe(2)
    expect(reject.mock.calls[1]?.[2].idempotencyKey).not.toBe(
        reject.mock.calls[0]?.[2].idempotencyKey,
    )
})
test.each(['actor', 'record'] as const)(
    'ignores late responses after changing %s and prevents double submit',
    async (change) => {
        let finish: (order: PurchaseOrder) => void = () => undefined
        approve.mockReturnValueOnce(
            new Promise((resolve) => {
                finish = resolve
            }),
        )
        const { state, order } = setup()
        state.open('approve')
        const pending = state.submit()
        await state.submit()
        expect(approve).toHaveBeenCalledTimes(1)
        if (change === 'record') order.value = submitted(6)
        else
            useSessionStore().user =
                sessionFixtures.find((actor) => actor.id === 'maker-demo') ?? null
        expect(approve.mock.calls[0]?.[2].signal.aborted).toBe(true)
        finish({ ...submitted(), status: 'approved' })
        await pending
        expect(order.value?.status).toBe('submitted')
        expect(state.pending.value).toBe(false)
        expect(state.action.value).toBeUndefined()
    },
)
test('restores review reason and key after a same-actor CSRF remount without replay', async () => {
    const first = setup()
    first.state.open('reject')
    first.state.reason.value = 'Perbaiki ukuran'
    reject.mockRejectedValueOnce(new ApiError('csrf'))
    await first.state.submit()
    expect(usePurchaseOrderRecoveryStore().review?.reason).toBe('Perbaiki ukuran')
    scopes.splice(0).forEach((scope) => scope.stop())
    const second = setup()
    expect(second.state.reason.value).toBe('Perbaiki ukuran')
    expect(reject).toHaveBeenCalledTimes(1)
    reject.mockResolvedValueOnce({ ...submitted(), status: 'rejected', allowedActions: [] })
    await second.state.submit()
    expect(reject.mock.calls[1]?.[2].idempotencyKey).toBe(reject.mock.calls[0]?.[2].idempotencyKey)
    expect(usePurchaseOrderRecoveryStore().review).toBeNull()
})

test('clears the review draft when rereading confirms a completed rejection', async () => {
    const { state, refresh, order } = setup()
    state.open('reject')
    state.reason.value = 'Perbaiki ukuran'
    reject.mockRejectedValueOnce(new ApiError('network'))
    await state.submit()
    refresh.mockImplementationOnce(async () => {
        order.value = {
            ...submitted(),
            status: 'rejected',
            version: 2,
            rejectionReason: 'Perbaiki ukuran',
            allowedActions: [],
        }
    })
    await state.reload()
    expect(state.reason.value).toBe('')
    expect(state.action.value).toBeUndefined()
    expect(state.uncertain.value).toBe(false)
})

test('clears review state immediately when a different route fails to load', async () => {
    const { state, order, selectedId } = setup()
    state.open('reject')
    state.reason.value = 'Private review draft'
    selectedId.value = 'missing-order'
    order.value = undefined
    expect(state.reason.value).toBe('')
    expect(state.action.value).toBeUndefined()
})
