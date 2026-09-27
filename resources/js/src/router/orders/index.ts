import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'orders.title',
    requiresAuth: true,
    ...accessRules['orders'],
}
export const orderRoutes: RouteRecordRaw[] = [
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/orders/OrderListPage.vue'),
        meta,
    },
    {
        path: '/orders/new',
        name: 'order-new',
        component: () => import('@/views/orders/OrderFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['orders.create.all'],
        },
    },
    {
        path: '/orders/:id',
        name: 'order-detail',
        component: () => import('@/views/orders/OrderDetailPage.vue'),
        meta,
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
