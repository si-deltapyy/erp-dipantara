import { Blob as NodeBlob } from 'node:buffer'
import { effectScope, ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { DocumentsApi } from '@/core/types/document'
import { useDocumentContent } from './useDocumentContent'
const { download, handleRequestFailure } = vi.hoisted(() => ({
    download: vi.fn<DocumentsApi['download']>(),
    handleRequestFailure: vi.fn(),
}))
vi.mock('./useDocumentsApi', () => ({ useDocumentsApi: () => ({ download }) }))
vi.mock('./useSession', () => ({ useSession: () => ({ handleRequestFailure }) }))
const scopes: ReturnType<typeof effectScope>[] = []
const document = {
    id: 'doc-1',
    fileName: 'synthetic.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 8,
}
const createUrl = vi.fn(() => 'blob:synthetic')
const revokeUrl = vi.fn()
beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    vi.stubGlobal('Blob', NodeBlob)
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: revokeUrl })
    createUrl.mockReturnValue('blob:synthetic')
})
afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop())
    vi.unstubAllGlobals()
})
function setup() {
    const scope = effectScope()
    scopes.push(scope)
    const identity = ref('po-1')
    const allowed = ref(true)
    const state = scope.run(() =>
        useDocumentContent(
            () => identity.value,
            () => allowed.value,
        ),
    )
    if (!state) throw new Error('Missing scope')
    return { state, identity, allowed, scope }
}
test('revokes preview URLs on close, permission change and unmount', async () => {
    const { state, allowed, scope } = setup()
    download.mockResolvedValue({ blob: new Blob(['%PDF-1.7']), fileName: document.fileName })
    await state.open(document, 'preview')
    expect(state.preview.value?.url).toBe('blob:synthetic')
    state.close()
    expect(revokeUrl).toHaveBeenCalledTimes(1)
    await state.open(document, 'preview')
    allowed.value = false
    expect(revokeUrl).toHaveBeenCalledTimes(2)
    allowed.value = true
    await state.open(document, 'preview')
    scope.stop()
    expect(revokeUrl).toHaveBeenCalledTimes(3)
})
test('aborts stale downloads and never creates a URL after parent changes', async () => {
    const { state, identity } = setup()
    let finish: ((value: { blob: Blob; fileName: string }) => void) | undefined
    download.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve
            }),
    )
    const pending = state.open(document, 'preview')
    identity.value = 'po-2'
    await nextTick()
    expect(download.mock.calls[0]?.[1].aborted).toBe(true)
    finish?.({ blob: new Blob(['%PDF-1.7']), fileName: document.fileName })
    await pending
    expect(createUrl).not.toHaveBeenCalled()
})
test('rejects unsafe content before creating any preview URL', async () => {
    const { state } = setup()
    download.mockResolvedValueOnce({
        blob: new Blob(['<script>unsafe</script>']),
        fileName: document.fileName,
    })
    await state.open(document, 'preview')
    expect(createUrl).not.toHaveBeenCalled()
    expect(state.error.value).toBe('documents.errors.validation')
})
test('releases download URLs when their owner unmounts before the timer', async () => {
    const { state, scope } = setup()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    download.mockResolvedValueOnce({ blob: new Blob(['%PDF-1.7']), fileName: document.fileName })
    await state.open(document, 'download')
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(revokeUrl).not.toHaveBeenCalled()
    scope.stop()
    expect(revokeUrl).toHaveBeenCalledWith('blob:synthetic')
})
