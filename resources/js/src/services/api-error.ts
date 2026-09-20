import axios from 'axios'
import { ApiError } from '@/core/types/api-error'
import type { ApiErrorKind } from '@/core/types/api-error'

const statusKinds: Readonly<Record<number, ApiErrorKind>> = {
    401: 'unauthenticated',
    403: 'forbidden',
    404: 'not-found',
    409: 'conflict',
    419: 'unauthenticated',
    422: 'validation',
}

export function normalizeApiError(cause: unknown): ApiError {
    if (cause instanceof ApiError) return cause
    if (!axios.isAxiosError(cause)) return new ApiError('unexpected')
    if (!cause.response) return new ApiError('network')
    return new ApiError(statusKinds[cause.response.status] ?? 'unexpected')
}

export function isRequestCancelled(cause: unknown): boolean {
    return axios.isCancel(cause) || (cause instanceof DOMException && cause.name === 'AbortError')
}
