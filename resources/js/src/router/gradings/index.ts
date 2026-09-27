import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'gradings.title',
    requiresAuth: true,
    ...accessRules['gradings'],
}
export const gradingRoutes: RouteRecordRaw[] = [
    {
        path: '/gradings',
        name: 'gradings',
        component: () => import('@/views/gradings/GradingListPage.vue'),
        meta,
    },
    {
        path: '/gradings/new',
        name: 'grading-new',
        component: () => import('@/views/gradings/GradingFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['gradings.create.all', 'gradings.create.assigned'],
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
