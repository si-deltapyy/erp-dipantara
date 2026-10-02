import { ApiError } from '@/core/types/api-error'
import type { DocumentPurpose } from '@/core/types/document'

export const documentSizeLimit = 5 * 1024 * 1024
export const documentMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'] as const

export function validateDocumentFile(file: File, purpose: DocumentPurpose): void {
    if (file.size < 1 || file.size > documentSizeLimit)
        throw new ApiError('validation', { file: ['documents.invalidSize'] })
    if (
        !documentMimeTypes.some((mime) => mime === file.type) ||
        (purpose === 'sakr' && file.type !== 'application/pdf')
    )
        throw new ApiError('validation', { file: ['documents.invalidType'] })
}
export async function validateDocumentSignature(file: Blob): Promise<void> {
    const prefix = new Uint8Array(await file.slice(0, 8).arrayBuffer())
    const signatures: Readonly<Record<string, readonly number[]>> = {
        'application/pdf': [37, 80, 68, 70, 45],
        'image/jpeg': [255, 216, 255],
        'image/png': [137, 80, 78, 71, 13, 10, 26, 10],
    }
    const signature = signatures[file.type]
    if (!signature || !signature.every((byte, index) => prefix[index] === byte))
        throw new ApiError('validation', { file: ['documents.invalidType'] })
}
export function safeDocumentName(name: string): string {
    const normalized = Array.from(name, (character) => {
        const code = character.charCodeAt(0)
        return code < 32 || code === 127 || character === '/' || character === '\\'
            ? '_'
            : character
    }).join('')
    return normalized.slice(0, 200) || 'document'
}
