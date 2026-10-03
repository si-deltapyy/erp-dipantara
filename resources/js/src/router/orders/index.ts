import { integrationPermissions } from '@/core/constants/business-permissions'
import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    featureUnavailable: true,
    titleKey: 'orders.title',
    requiresAuth: true,
    ...accessRules['orders'],
}
export const orderRoutes: RouteRecordRaw[] = [
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/orders/OrderListPage.vue'),
        meta: { ...meta, featureUnavailable: false },
    },
    {
        path: '/orders/new',
        name: 'order-new',
        component: () => import('@/views/orders/OrderFormPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: [...integrationPermissions['orders.create']],
            anyPermissions: [],
        },
    },
    {
        path: '/orders/:id',
        name: 'order-detail',
        component: () => import('@/views/orders/OrderDetailPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: [...integrationPermissions['orders.read']],
            anyPermissions: [],
        },
    },
    {
        path: '/orders/:id/edit',
        name: 'order-edit',
        component: () => import('@/views/orders/OrderFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['orders.update.all'],
        },
    },
]
