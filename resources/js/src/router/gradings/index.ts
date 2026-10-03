import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    featureUnavailable: true,
    titleKey: 'gradings.title',
    requiresAuth: true,
    ...accessRules['gradings'],
}
export const gradingRoutes: RouteRecordRaw[] = [
    {
        path: '/gradings/:id/revise',
        name: 'grading-revise',
        component: () => import('@/views/gradings/GradingFormPage.vue'),
        meta: { ...meta, anyPermissions: ['gradings.revise.all', 'gradings.revise.assigned'] },
    },
    {
        path: '/gradings',
        name: 'gradings',
        component: () => import('@/views/gradings/GradingListPage.vue'),
        meta: { ...meta, featureUnavailable: false },
    },
    {
        path: '/gradings/new',
        name: 'grading-new',
        component: () => import('@/views/gradings/GradingFormPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: [
                'gradings.read.all',
                'gradings.create.all',
                'purchase-orders.read.all',
                'mitras.read.all',
                'graders.read.all',
                'timber-products.read.all',
                'timber-prices.read.all',
            ],
            anyPermissions: [],
        },
    },
    {
        path: '/gradings/:id',
        name: 'grading-detail',
        component: () => import('@/views/gradings/GradingDetailPage.vue'),
        meta,
    },
    {
        path: '/gradings/:id/edit',
        name: 'grading-edit',
        component: () => import('@/views/gradings/GradingFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['gradings.update.all', 'gradings.update.assigned'],
        },
    },
]
