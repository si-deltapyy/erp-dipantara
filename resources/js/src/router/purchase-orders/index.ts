import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    featureUnavailable: true,
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
        meta: { ...meta, featureUnavailable: false },
    },
    {
        path: '/purchase-orders/new',
        name: 'purchase-order-new',
        component: () => import('@/views/purchase-orders/PurchaseOrderFormPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: [
                'purchase-orders.read.all',
                'purchase-orders.create.all',
                'buyers.read.all',
                'timber-products.read.all',
                'timber-prices.read.all',
            ],
            anyPermissions: [],
        },
    },
    {
        path: '/purchase-orders/:id',
        name: 'purchase-order-detail',
        component: () => import('@/views/purchase-orders/PurchaseOrderDetailPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: ['purchase-orders.read.all'],
            anyPermissions: [],
        },
    },
    {
        path: '/purchase-orders/:id/edit',
        name: 'purchase-order-edit',
        component: () => import('@/views/purchase-orders/PurchaseOrderFormPage.vue'),
        meta: {
            ...meta,
            featureUnavailable: false,
            requiredPermissions: [
                'purchase-orders.read.all',
                'purchase-orders.update.all',
                'buyers.read.all',
                'timber-products.read.all',
                'timber-prices.read.all',
            ],
            anyPermissions: [],
        },
    },
]
