import type { InjectionKey } from 'vue'
import type { DashboardApi } from '@/core/types/dashboard'
export const dashboardApiKey: InjectionKey<DashboardApi> = Symbol('dashboard-api')
