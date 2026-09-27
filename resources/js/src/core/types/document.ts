export type DocumentParentType = 'purchase-order' | 'delivery' | 'payment' | 'invoice' | 'report'
export type DocumentPurpose = 'approved_po' | 'sakr' | 'payment_proof'
export interface DocumentReference {
    readonly id: string
    readonly fileName: string
    readonly mimeType: string
    readonly sizeBytes: number
}
export interface DocumentParent {
    readonly parentType: DocumentParentType
    readonly parentId: string
}
export interface DocumentUpload {
    readonly parentType: 'purchase-order' | 'delivery' | 'payment'
    readonly parentId: string | null
    readonly purpose: DocumentPurpose
    readonly file: File
}
export interface DocumentUploadOptions {
    readonly idempotencyKey: string
    readonly signal: AbortSignal
    readonly onProgress?: (percent: number) => void
}
export interface DocumentContent {
    readonly blob: Blob
    readonly fileName: string
}
export interface DocumentsApi {
    list(parent: DocumentParent, signal: AbortSignal): Promise<readonly DocumentReference[]>
    upload(input: DocumentUpload, options: DocumentUploadOptions): Promise<DocumentReference>
    download(id: string, signal: AbortSignal): Promise<DocumentContent>
    subscribe(listener: () => void): () => void
}
