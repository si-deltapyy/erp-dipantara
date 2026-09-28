import type {
    DocumentContent,
    DocumentParent,
    DocumentReference,
    DocumentUpload,
} from '@/core/types/document'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { safeDocumentName, validateDocumentSignature } from '@/core/domain/document-file'
import { validateDocumentParent, validateDocumentUpload } from '@/api/document-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import type { DatabaseOptions } from './database'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { hashMutationPayload } from './idempotency'
import type { StoredDocument } from './document-schema'
import type { DemoStore } from './schema'
import {
    assertDocumentParentAccess,
    assertStoredDocumentAccess,
    requireDocumentPermission,
} from './document-policy'

const stores: readonly DemoStore[] = [
    'metadata',
    'reportExports',
    'gradings',
    'assignments',
    'invoices',
    'payments',
    'deliveries',
    'documents',
    'purchase-orders',
    'documentMutations',
    'audit',
]
function reference(document: StoredDocument): DocumentReference {
    return {
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
    }
}
export class DocumentRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        parent: DocumentParent,
        signal: AbortSignal,
    ): Promise<readonly DocumentReference[]> {
        const actor = requireDocumentPermission(user, 'read')
        validateDocumentParent(parent)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                await assertDocumentParentAccess(transaction, actor, parent, 'read')
                return (await transaction.list('documents'))
                    .filter(
                        (document) =>
                            document.parentType === parent.parentType &&
                            document.parentId === parent.parentId,
                    )
                    .map(reference)
            },
            signal,
        )
    }
    async download(
        user: SessionUser | null,
        id: string,
        signal: AbortSignal,
    ): Promise<DocumentContent> {
        const actor = requireDocumentPermission(user, 'download')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const document = await transaction.get('documents', id)
                if (!document) throw new ApiError('not-found')
                await assertStoredDocumentAccess(transaction, actor, document, 'download')
                return { blob: document.content, fileName: document.fileName }
            },
            signal,
        )
    }
    async upload(
        user: SessionUser | null,
        input: DocumentUpload,
        key: string,
        generation: string,
        signal: AbortSignal,
    ): Promise<DocumentReference> {
        const actor = requireDocumentPermission(user, 'upload')
        validateDocumentUpload(input, key)
        await validateDocumentSignature(input.file)
        const digest = await crypto.subtle.digest('SHA-256', await input.file.arrayBuffer())
        const payloadHash = await hashMutationPayload({
            parentType: input.parentType,
            parentId: input.parentId,
            purpose: input.purpose,
            name: input.file.name,
            mime: input.file.type,
            generation,
            bytes: Array.from(new Uint8Array(digest)),
        })
        return runDemoTransaction(
            this.options,
            stores,
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (generation !== metadata.generation) throw new ApiError('conflict')
                if (input.parentId !== null)
                    await assertDocumentParentAccess(
                        transaction,
                        actor,
                        { parentType: input.parentType, parentId: input.parentId },
                        'upload',
                    )
                const receiptId = JSON.stringify([actor.id, 'POST', '/api/v1/documents', key])
                const receipt = await transaction.get('documentMutations', receiptId)
                if (receipt && receipt.expiresAt > Date.now()) {
                    if (receipt.payloadHash !== payloadHash) throw new ApiError('conflict')
                    const saved = await transaction.get('documents', receipt.documentId)
                    if (!saved) throw new ApiError('not-found')
                    await assertStoredDocumentAccess(transaction, actor, saved, 'upload')
                    return reference(saved)
                }
                const document: StoredDocument = {
                    id: crypto.randomUUID(),
                    parentType: input.parentType,
                    parentId: input.parentId,
                    purpose: input.purpose,
                    fileName: safeDocumentName(input.file.name),
                    mimeType: input.file.type,
                    sizeBytes: input.file.size,
                    createdByUserId: actor.id,
                    expiresAt: input.parentId === null ? Date.now() + 86400000 : null,
                    content: input.file.slice(0, input.file.size, input.file.type),
                }
                await transaction.put('documents', document)
                await transaction.put('documentMutations', {
                    id: receiptId,
                    documentId: document.id,
                    payloadHash,
                    expiresAt: Date.now() + 86400000,
                })
                await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
                await transaction.put('audit', {
                    id: crypto.randomUUID(),
                    resource: 'documents',
                    recordId: document.id,
                    actorId: actor.id,
                    action: 'upload',
                })
                return reference(document)
            },
            signal,
        )
    }
}
