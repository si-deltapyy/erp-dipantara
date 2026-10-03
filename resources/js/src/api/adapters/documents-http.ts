import type { DocumentsApi } from '@/core/types/document'
import { ApiError } from '@/core/types/api-error'

export function createHttpDocuments(): DocumentsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        list: unavailable,
        upload: unavailable,
        download: unavailable,
        subscribe: () => () => undefined,
    }
}
