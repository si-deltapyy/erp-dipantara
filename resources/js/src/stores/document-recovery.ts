import { defineStore } from 'pinia'
import type { DocumentUploadTarget } from '@/core/types/document'

export interface DocumentDraft {
    readonly actorId: string
    readonly target: DocumentUploadTarget
    readonly file: File
    readonly idempotencyKey: string
    readonly uncertain: boolean
}
export const useDocumentRecoveryStore = defineStore('document-recovery', {
    state: (): { draft: DocumentDraft | null } => ({ draft: null }),
})
