import type { RouteRecordRaw } from 'vue-router'
export const reportRoutes: RouteRecordRaw[] = [
    {
        path: '/reports/production',
        name: 'production-report',
        component: () => import('@/views/reports/ProductionReportPage.vue'),
        meta: {
            titleKey: 'production.title',
            requiresAuth: true,
            anyPermissions: ['reports.read.all', 'reports.read.assigned'],
        },
    },
]
