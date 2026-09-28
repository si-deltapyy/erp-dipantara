import type { InjectionKey } from 'vue'
import type { ClosingsApi } from '@/core/types/closing'
export const closingsApiKey: InjectionKey<ClosingsApi> = Symbol('closings-api')
