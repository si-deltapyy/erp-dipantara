export type StorageFailureKind =
    'unavailable' | 'blocked' | 'quota' | 'incompatible' | 'aborted' | 'failed'
export class DemoStorageError extends Error {
    constructor(public readonly kind: StorageFailureKind) {
        super(kind)
        this.name = 'DemoStorageError'
    }
}
export function normalizeStorageError(cause: unknown): Error {
    if (cause instanceof Error && !(cause instanceof DOMException)) return cause
    if (cause instanceof DOMException) {
        if (cause.name === 'QuotaExceededError') return new DemoStorageError('quota')
        if (cause.name === 'AbortError') return cause
        if (cause.name === 'SecurityError' || cause.name === 'InvalidStateError')
            return new DemoStorageError('unavailable')
        if (cause.name === 'VersionError') return new DemoStorageError('incompatible')
    }
    return new DemoStorageError('failed')
}
