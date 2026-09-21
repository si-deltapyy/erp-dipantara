export type ApiErrorKind =
    | 'validation'
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
    ) {
        super(kind)
        this.name = 'ApiError'
    }
}
