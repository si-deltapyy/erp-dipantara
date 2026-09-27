import axios from 'axios'
import { ApiError } from '@/core/types/api-error'
import type { ApiErrorKind } from '@/core/types/api-error'

const statusKinds: Readonly<Record<number, ApiErrorKind>> = {
    401: 'unauthenticated',
    403: 'forbidden',
    404: 'not-found',
    409: 'conflict',
    419: 'csrf',
    429: 'rate-limited',
    422: 'validation',
}

export function normalizeApiError(cause: unknown): ApiError {
    if (cause instanceof ApiError) return cause
    if (!axios.isAxiosError(cause)) return new ApiError('unexpected')
    if (!cause.response) return new ApiError('network')
    return new ApiError(
        statusKinds[cause.response.status] ?? 'unexpected',
        parseFieldErrors(cause.response.data),
        parseErrorIdentifier(cause.response.data, 'code'),
        parseErrorIdentifier(cause.response.data, 'requestId'),
    )
}

export function isRequestCancelled(cause: unknown): boolean {
    return axios.isCancel(cause) || (cause instanceof DOMException && cause.name === 'AbortError')
}

function parseErrorIdentifier(response: unknown, field: 'code' | 'requestId'): string | undefined {
    if (!response || typeof response !== 'object' || !(field in response)) return undefined
    const value = (response as Record<string, unknown>)[field]
    return typeof value === 'string' ? value : undefined
}

function parseFieldErrors(response: unknown): Readonly<Record<string, readonly string[]>> {
    if (!response || typeof response !== 'object' || !('errors' in response)) return {}
    const errors = response.errors
    if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {}
    return Object.fromEntries(
        Object.entries(errors).filter(
            ([, messages]) =>
                Array.isArray(messages) && messages.every((message) => typeof message === 'string'),
        ),
    )
}
