import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    featureUnavailable: true,
    titleKey: 'closings.title',
    requiresAuth: true,
    ...accessRules.closings,
}
export const closingRoutes: RouteRecordRaw[] = [
    {
        path: '/closings',
        name: 'closings',
        component: () => import('@/views/closing/ClosingListPage.vue'),
        meta,
    },
    {
        path: '/closings/new',
        name: 'closing-new',
        component: () => import('@/views/closing/ClosingRequestPage.vue'),
        meta: { ...meta, requiredPermissions: ['closings.request.all', 'closings.read.all'] },
    },
    {
        path: '/closings/:id',
        name: 'closing-detail',
        component: () => import('@/views/closing/ClosingDetailPage.vue'),
        meta,
    },
]
