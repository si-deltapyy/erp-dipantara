import type { InjectionKey } from 'vue'
import type { GradersApi } from '@/core/types/grader'

export const gradersApiKey: InjectionKey<GradersApi> = Symbol('graders-api')
