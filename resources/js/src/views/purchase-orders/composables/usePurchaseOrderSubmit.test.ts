import { effectScope, nextTick, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { usePurchaseOrderSubmit } from './usePurchaseOrderSubmit'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { purchaseOrderFixtures } from '@/api/mocks/purchase-order-fixtures'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import type { PurchaseOrder, PurchaseOrdersApi } from '@/core/types/purchase-order'
import { ApiError } from '@/core/types/api-error'

const { submit, handleRequestFailure } = vi.hoisted(() => ({
    submit: vi.fn<PurchaseOrdersApi['submit']>(),
    handleRequestFailure: vi.fn(),
}))
vi.mock('./usePurchaseOrderApi', () => ({ usePurchaseOrderApi: () => ({ submit }) }))
vi.mock('@/composables/useSession', () => ({ useSession: () => ({ handleRequestFailure }) }))

const scopes: ReturnType<typeof effectScope>[] = []
beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'admin-demo') ?? null
    submit.mockReset()
})
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

function draft(index = 0): PurchaseOrder {
    const order = purchaseOrderFixtures[index]
    if (!order) throw new Error('Missing PO fixture')
    return { ...order, allowedActions: ['update', 'submit'] }
}
function setup(): {
    order: ReturnType<typeof shallowRef<PurchaseOrder | undefined>>
    state: ReturnType<typeof usePurchaseOrderSubmit>
} {
    const scope = effectScope()
    scopes.push(scope)
    const order = shallowRef<PurchaseOrder | undefined>(draft())
    const state = scope.run(() => usePurchaseOrderSubmit(order))
    if (!state) throw new Error('Missing effect scope')
    return { order, state }
}
function deferred(): {
    promise: Promise<PurchaseOrder>
    resolve: (order: PurchaseOrder) => void
    reject: (cause: unknown) => void
} {
    let resolve: (order: PurchaseOrder) => void = () => undefined
    let reject: (cause: unknown) => void = () => undefined
    const promise = new Promise<PurchaseOrder>((success, failure) => {
        resolve = success
        reject = failure
    })
    return { promise, resolve, reject }
}

test('isolates pending submits between PO records even when transport ignores abort', async () => {
    const first = deferred()
    const second = deferred()
    submit.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { order, state } = setup()
    const initial = state.submit()
    order.value = draft(5)
    await nextTick()
    expect(submit.mock.calls[0]?.[2].signal.aborted).toBe(true)
    expect(state.pending.value).toBe(false)
    const latest = state.submit()
    first.resolve({ ...draft(), status: 'submitted' })
    await initial
    expect(order.value?.id).toBe('demo-po-06')
    expect(state.pending.value).toBe(true)
    second.resolve({ ...draft(5), status: 'submitted' })
    await latest
    expect(order.value?.status).toBe('submitted')
    expect(state.pending.value).toBe(false)
})

test('clears confirmation and uncertain retry state when the selected PO changes', async () => {
    submit.mockRejectedValueOnce(new ApiError('network'))
    const { order, state } = setup()
    await state.submit()
    const previousKey = submit.mock.calls[0]?.[2].idempotencyKey
    expect(state.uncertain.value).toBe(true)
    state.confirming.value = true
    order.value = draft(5)
    await nextTick()
    expect(state.confirming.value).toBe(false)
    expect(state.uncertain.value).toBe(false)
    expect(state.error.value).toBe('')
    submit.mockResolvedValueOnce({ ...draft(5), status: 'submitted' })
    await state.submit()
    expect(submit.mock.calls[1]?.[2].idempotencyKey).not.toBe(previousKey)
})

test('drops late authentication errors and recovery snapshots after an actor switch', async () => {
    const response = deferred()
    submit.mockReturnValueOnce(response.promise)
    const { state } = setup()
    const pending = state.submit()
    state.confirming.value = true
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'maker-demo') ?? null
    await nextTick()
    expect(state.confirming.value).toBe(false)
    expect(state.pending.value).toBe(false)
    response.reject(new ApiError('csrf'))
    await pending
    expect(handleRequestFailure).not.toHaveBeenCalled()
    expect(usePurchaseOrderRecoveryStore().snapshot).toBeNull()
    expect(state.canSubmit.value).toBe(false)
})

test('reuses the idempotency key for an explicit retry of the same PO version', async () => {
    const { state } = setup()
    submit.mockRejectedValueOnce(new ApiError('network'))
    await state.submit()
    expect(submit).toHaveBeenCalledTimes(1)
    submit.mockResolvedValueOnce({ ...draft(), status: 'submitted', allowedActions: [] })
    await state.submit()
    expect(submit.mock.calls[1]?.[2].idempotencyKey).toBe(submit.mock.calls[0]?.[2].idempotencyKey)
    expect(state.uncertain.value).toBe(false)
    expect(state.canSubmit.value).toBe(false)
})

test('restores the same actor submit key after CSRF remount and detail reload', async () => {
    const { state } = setup()
    submit.mockRejectedValueOnce(new ApiError('csrf'))
    await state.submit()
    const originalKey = submit.mock.calls[0]?.[2].idempotencyKey
    expect(usePurchaseOrderRecoveryStore().snapshot?.idempotencyKey).toBe(originalKey)
    scopes.splice(0).forEach((scope) => scope.stop())
    const scope = effectScope()
    scopes.push(scope)
    const order = shallowRef<PurchaseOrder>()
    const recovered = scope.run(() => usePurchaseOrderSubmit(order))
    if (!recovered) throw new Error('Missing recovery scope')
    order.value = draft()
    await nextTick()
    expect(recovered.error.value).toBe('purchase-orders.errors.csrf')
    expect(submit).toHaveBeenCalledTimes(1)
    submit.mockResolvedValueOnce({ ...draft(), status: 'submitted', allowedActions: [] })
    await recovered.submit()
    expect(submit.mock.calls[1]?.[2].idempotencyKey).toBe(originalKey)
    expect(usePurchaseOrderRecoveryStore().snapshot).toBeNull()
})
