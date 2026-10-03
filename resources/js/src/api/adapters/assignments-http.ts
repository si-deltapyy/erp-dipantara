import type { AssignmentsApi } from '@/core/types/assignment'
import { ApiError } from '@/core/types/api-error'

export function createHttpAssignments(): AssignmentsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        list: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
