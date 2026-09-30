import { inject } from 'vue'
import { assignmentsApiKey } from '@/api/assignments-api'
import type { AssignmentsApi } from '@/core/types/assignment'
export function useAssignmentApi(): AssignmentsApi {
    const api = inject(assignmentsApiKey)
    if (!api) throw new Error('Assignments API is not configured')
    return api
}
