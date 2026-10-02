import { inject } from 'vue'
import type { DashboardSnapshot } from '@/core/types/dashboard'
import { dashboardApiKey } from '@/api/dashboard-api'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useSessionStore } from '@/stores/session'
import { hasBusinessPermission } from '@/core/domain/record-policy'
export function useDashboard(): ReturnType<typeof useRecordDetail<DashboardSnapshot>> {
    const api = inject(dashboardApiKey)
    if (!api) throw new Error('Dashboard API is not configured')
    const session = useSessionStore()
    return useRecordDetail(
        { get: (_id, signal) => api.get(signal), subscribe: api.subscribe },
        'dashboard',
        true,
        () => (hasBusinessPermission(session.user, 'dashboard.read') ? 'dashboard' : undefined),
    )
}
