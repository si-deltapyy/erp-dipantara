import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'purchase-orders.title',
    requiresAuth: true,
    ...accessRules['purchase-orders'],
}
export const purchaseOrderRoutes: RouteRecordRaw[] = [
    {
        path: '/reports/buyer-history',
        name: 'buyer-history',
        component: () => import('@/views/purchase-orders/PurchaseOrderListPage.vue'),
        meta: {
            ...meta,
            titleKey: 'purchase-orders.history',
            requiredPermissions: ['reports.read.all'],
        },
    },
    {
        path: '/purchase-orders',
        name: 'purchase-orders',
        component: () => import('@/views/purchase-orders/PurchaseOrderListPage.vue'),
        meta,
    },
    {
        path: '/purchase-orders/new',
        name: 'purchase-order-new',
        component: () => import('@/views/purchase-orders/PurchaseOrderFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['purchase-orders.create.own', 'purchase-orders.create.all'],
        },
    },
    {
        path: '/purchase-orders/:id',
        name: 'purchase-order-detail',
        component: () => import('@/views/purchase-orders/PurchaseOrderDetailPage.vue'),
        meta,
    },
    {
        path: '/purchase-orders/:id/edit',
        name: 'purchase-order-edit',
        component: () => import('@/views/purchase-orders/PurchaseOrderFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['purchase-orders.update.own', 'purchase-orders.update.all'],
        },
    },
]
