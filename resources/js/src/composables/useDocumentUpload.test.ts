import { effectScope, nextTick, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { DocumentsApi } from '@/core/types/document'
import { ApiError } from '@/core/types/api-error'
import { purchaseOrderFixtures } from '@/api/mocks/purchase-order-fixtures'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import { useSessionStore } from '@/stores/session'
import { useDocumentRecoveryStore } from '@/stores/document-recovery'
import { useDocumentUpload } from './useDocumentUpload'

const { upload, handleRequestFailure } = vi.hoisted(() => ({
    upload: vi.fn<DocumentsApi['upload']>(),
    handleRequestFailure: vi.fn(),
}))
vi.mock('./useDocumentsApi', () => ({ useDocumentsApi: () => ({ upload }) }))
vi.mock('./useSession', () => ({ useSession: () => ({ handleRequestFailure }) }))
const scopes: ReturnType<typeof effectScope>[] = []
const file = new File(['%PDF-1.7'], 'synthetic.pdf', { type: 'application/pdf' })
const reference = { id: 'doc-1', fileName: file.name, mimeType: file.type, sizeBytes: file.size }
beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'admin-demo') ?? null
    vi.resetAllMocks()
})
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
function setup() {
    const fixture = purchaseOrderFixtures[0]
    if (!fixture) throw new Error('Missing fixture')
    const order = shallowRef(fixture)
    const scope = effectScope()
    scopes.push(scope)
    const refresh = vi.fn(async () => undefined)
    const state = scope.run(() => useDocumentUpload(() => order.value, refresh))
    if (!state) throw new Error('Missing scope')
    return { state, order, refresh, scope }
}
test('preserves uncertain payload and key, then clears draft only after successful retry', async () => {
    const { state, refresh, order } = setup()
    const original = order.value
    state.select(file)
    upload.mockRejectedValueOnce(new ApiError('network'))
    await state.upload()
    expect(state.uncertain.value).toBe(true)
    state.select(new File(['other'], 'other.pdf', { type: 'application/pdf' }))
    expect(state.file.value).toBe(file)
    upload.mockResolvedValueOnce(reference)
    await state.upload()
    expect(upload.mock.calls[1]?.[1].idempotencyKey).toBe(upload.mock.calls[0]?.[1].idempotencyKey)
    expect(state.file.value).toBeUndefined()
    expect(state.saved.value).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(order.value).toBe(original)
})
test('prevents double submit and ignores completion after parent changes', async () => {
    const { state, order, refresh } = setup()
    let finish: ((value: typeof reference) => void) | undefined
    upload.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve
            }),
    )
    state.select(file)
    const pending = state.upload()
    await state.upload()
    expect(upload).toHaveBeenCalledTimes(1)
    order.value = { ...order.value, id: 'another-po' }
    await nextTick()
    expect(upload.mock.calls[0]?.[1].signal.aborted).toBe(true)
    finish?.(reference)
    await pending
    expect(refresh).not.toHaveBeenCalled()
    expect(state.saved.value).toBe(false)
})
test('retains field-error draft and requires selecting again after conflict', async () => {
    const { state } = setup()
    state.select(file)
    upload.mockRejectedValueOnce(new ApiError('validation'))
    await state.upload()
    expect(state.file.value).toBe(file)
    expect(state.fileError.value).toBe('documents.uploadInvalid')
    state.select(file)
    upload.mockRejectedValueOnce(new ApiError('conflict'))
    await state.upload()
    await state.upload()
    expect(upload).toHaveBeenCalledTimes(2)
    expect(state.fileError.value).toBe('documents.errors.conflict')
})
test('recovers a 419 draft for the same actor without replaying the write', async () => {
    const first = setup()
    first.state.select(file)
    upload.mockRejectedValueOnce(new ApiError('csrf'))
    await first.state.upload()
    expect(useDocumentRecoveryStore().draft?.file).toBe(file)
    first.scope.stop()
    const second = setup()
    expect(second.state.file.value).toBe(file)
    expect(second.state.error.value).toBe('documents.errors.csrf')
    expect(upload).toHaveBeenCalledTimes(1)
    upload.mockResolvedValueOnce(reference)
    await second.state.upload()
    expect(upload.mock.calls[1]?.[1].idempotencyKey).toBe(upload.mock.calls[0]?.[1].idempotencyKey)
})
test('does not restore another actor draft and clears local file when permission is revoked', async () => {
    const first = setup()
    first.state.select(file)
    upload.mockRejectedValueOnce(new ApiError('csrf'))
    await first.state.upload()
    first.scope.stop()
    const user = useSessionStore().user
    if (!user) throw new Error('Missing actor')
    useSessionStore().user = { ...user, id: 'another-actor' }
    const second = setup()
    expect(second.state.file.value).toBeUndefined()
    second.state.select(file)
    useSessionStore().user = { ...user, permissions: [] }
    await nextTick()
    expect(second.state.file.value).toBeUndefined()
    await second.state.upload()
    expect(upload).toHaveBeenCalledTimes(1)
})
