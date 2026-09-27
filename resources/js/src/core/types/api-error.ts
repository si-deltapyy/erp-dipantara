export type ApiErrorKind =
    | 'validation'
    | 'csrf'
    | 'rate-limited'
    | 'unauthenticated'
    | 'forbidden'
    | 'not-found'
    | 'conflict'
    | 'network'
    | 'unexpected'

export class ApiError extends Error {
    constructor(
        public readonly kind: ApiErrorKind,
        public readonly fieldErrors: Readonly<Record<string, readonly string[]>> = {},
        public readonly code?: string,
        public readonly requestId?: string,
    ) {
        super(kind)
        this.name = 'ApiError'
    }
}
