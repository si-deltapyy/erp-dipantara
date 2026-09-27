import type { DocumentReference, DocumentUpload } from '@/core/types/document'

export interface StoredDocument extends DocumentReference {
    readonly parentType: DocumentUpload['parentType']
    readonly parentId: string | null
    readonly purpose: DocumentUpload['purpose']
    readonly createdByUserId: string
    readonly expiresAt: number | null
    readonly content: Blob
}
export interface DocumentReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly documentId: string
}
export interface DocumentAudit {
    readonly id: string
    readonly resource: 'documents'
    readonly recordId: string
    readonly actorId: string
    readonly action: 'upload'
}
