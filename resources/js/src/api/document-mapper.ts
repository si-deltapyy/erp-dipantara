import type { DocumentReference, DocumentUpload, DocumentParent } from '@/core/types/document'
import { ApiError } from '@/core/types/api-error'
import { validateDocumentFile } from '@/core/domain/document-file'
import {
    parseObject,
    parseId,
    parseString,
    parseInteger,
    requireKeys,
} from './contracts/value-parsers'

export function parseDocument(value: unknown): DocumentReference {
    const record = parseObject(value, 'document')
    requireKeys(record, ['id', 'fileName', 'mimeType', 'sizeBytes'], 'document')
    return {
        id: parseId(record.id),
        fileName: parseString(record.fileName, 'fileName'),
        mimeType: parseString(record.mimeType, 'mimeType'),
        sizeBytes: parseInteger(record.sizeBytes, 'sizeBytes'),
    }
}
export function validateDocumentParent(parent: DocumentParent): void {
    parseId(parent.parentId, 'parentId')
    if (!['purchase-order', 'delivery', 'payment', 'invoice', 'report'].includes(parent.parentType))
        throw new ApiError('validation')
}
export function validateDocumentUpload(input: DocumentUpload, key: string): void {
    const purposes = { 'purchase-order': 'approved_po', delivery: 'sakr', payment: 'payment_proof' }
    if (purposes[input.parentType] !== input.purpose) throw new ApiError('validation')
    if (input.parentId !== null) {
        parseId(input.parentId, 'parentId')
        if (input.parentId === 'null') throw new ApiError('validation')
    }
    if (!key.trim() || key.length > 100) throw new ApiError('validation')
    validateDocumentFile(input.file, input.purpose)
}
