import type { InjectionKey } from 'vue'
import type { AssignmentsApi } from '@/core/types/assignment'
export const assignmentsApiKey: InjectionKey<AssignmentsApi> = Symbol('assignments-api')
