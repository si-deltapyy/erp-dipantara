import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { DocumentReference, DocumentUploadTarget } from '@/core/types/document'
import { validateDocumentFile } from '@/core/domain/document-file'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useDocumentRecoveryStore } from '@/stores/document-recovery'
import { useSessionStore } from '@/stores/session'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'
import { useDocumentsApi } from './useDocumentsApi'
import { useSession } from './useSession'

export interface DocumentUploadState {
    file: Ref<File | undefined>
    pending: Ref<boolean>
    progress: Ref<number>
    error: Ref<string>
    fileError: Ref<string>
    uncertain: Ref<boolean>
    saved: Ref<boolean>
    canUpload: ComputedRef<boolean>
    select(file?: File): void
    upload(): Promise<void>
}
export function useDocumentTransfer(
    target: () => DocumentUploadTarget,
    onUploaded: (document: DocumentReference) => Promise<void>,
    onRecovery?: () => void,
): DocumentUploadState {
    const api = useDocumentsApi()
    const store = useSessionStore()
    const session = useSession()
    const recovery = useDocumentRecoveryStore()
    const file = shallowRef<File>()
    const pending = ref(false)
    const progress = ref(0)
    const error = ref('')
    const fileError = ref('')
    const uncertain = ref(false)
    const saved = ref(false)
    let key: string = crypto.randomUUID()
    let active: AbortController | undefined
    const canUpload = computed(
        () =>
            target().permitted &&
            evaluateRecordAccess(store.user, 'documents.upload', target().scope) === 'allowed',
    )
    function select(selected?: File): void {
        if (pending.value || uncertain.value) return
        file.value = selected
        fileError.value = ''
        error.value = ''
        saved.value = false
        key = crypto.randomUUID()
        recovery.$reset()
        if (selected) {
            try {
                validateDocumentFile(selected, target().purpose)
            } catch (cause) {
                fileError.value =
                    normalizeApiError(cause).fieldErrors.file?.[0] ?? 'documents.invalidType'
            }
        }
    }
    function restore(): void {
        const draft = recovery.draft
        if (
            draft &&
            draft.actorId === store.user?.id &&
            draft.target.identity === target().identity &&
            canUpload.value
        ) {
            file.value = draft.file
            key = draft.idempotencyKey
            uncertain.value = draft.uncertain
            error.value = 'documents.errors.csrf'
            recovery.$reset()
        }
    }
    async function upload(): Promise<void> {
        if (pending.value || !canUpload.value || !file.value || fileError.value || !store.user)
            return
        const actorId = store.user.id
        const destination = target()
        const selected = file.value
        const request = new AbortController()
        active = request
        pending.value = true
        error.value = ''
        saved.value = false
        progress.value = 0
        try {
            const document = await api.upload(
                {
                    parentType: destination.parentType,
                    parentId: destination.parentId,
                    purpose: destination.purpose,
                    file: selected,
                },
                {
                    idempotencyKey: key,
                    signal: request.signal,
                    onProgress: (percent) => {
                        if (!request.signal.aborted) progress.value = percent
                    },
                },
            )
            if (request.signal.aborted) return
            file.value = undefined
            uncertain.value = false
            key = crypto.randomUUID()
            saved.value = true
            recovery.$reset()
            await onUploaded(document)
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            uncertain.value = uncertain.value || ['network', 'unexpected'].includes(failure.kind)
            error.value = `documents.errors.${failure.kind}`
            if (failure.kind === 'validation') fileError.value = 'documents.uploadInvalid'
            if (failure.kind === 'conflict') fileError.value = 'documents.errors.conflict'
            if (failure.kind === 'csrf') {
                onRecovery?.()
                recovery.draft = {
                    actorId,
                    target: destination,
                    file: selected,
                    idempotencyKey: key,
                    uncertain: uncertain.value,
                }
            }
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pending.value = false
        }
    }
    watch([() => store.user, () => target().identity, canUpload], () => {
        active?.abort()
        file.value = undefined
        pending.value = false
        uncertain.value = false
        restore()
    })
    restore()
    onScopeDispose(() => active?.abort())
    return {
        file,
        pending,
        progress,
        error,
        fileError,
        uncertain,
        saved,
        canUpload,
        select,
        upload,
    }
}
