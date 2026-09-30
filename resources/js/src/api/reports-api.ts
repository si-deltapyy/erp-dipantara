import type { InjectionKey } from 'vue'
import type { ReportsApi } from '@/core/types/report'
export const reportsApiKey: InjectionKey<ReportsApi> = Symbol('reports-api')
