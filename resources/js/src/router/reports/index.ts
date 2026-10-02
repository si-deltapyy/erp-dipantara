import type { RouteRecordRaw } from 'vue-router'
export const reportRoutes: RouteRecordRaw[] = [
    {
        path: '/reports/purchase-prices',
        name: 'purchase-price-report',
        component: () => import('@/views/reports/PurchasePriceReportPage.vue'),
        meta: {
            titleKey: 'reports.prices',
            requiresAuth: true,
            requiredPermissions: ['reports.read.all', 'timber-prices.read.all'],
        },
    },
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
