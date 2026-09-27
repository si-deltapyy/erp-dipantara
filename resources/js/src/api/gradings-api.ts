import type { InjectionKey } from 'vue'
import type { GradingsApi } from '@/core/types/grading'
export const gradingsApiKey: InjectionKey<GradingsApi> = Symbol('gradings-api')
