import type { DocumentReference, DocumentUpload, DocumentParentType } from '@/core/types/document'

export interface StoredDocument extends DocumentReference {
    readonly parentType: DocumentParentType
    readonly parentId: string | null
    readonly purpose: DocumentUpload['purpose'] | 'invoice_pdf'
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
