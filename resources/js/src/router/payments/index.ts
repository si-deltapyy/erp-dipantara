import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = { titleKey: 'payments.title', requiresAuth: true, ...accessRules.payments }
export const paymentRoutes: RouteRecordRaw[] = [
    {
        path: '/payments',
        name: 'payments',
        component: () => import('@/views/payments/PaymentListPage.vue'),
        meta,
    },
    {
        path: '/payments/new',
        name: 'payment-new',
        component: () => import('@/views/payments/PaymentFormPage.vue'),
        meta: { ...meta, anyPermissions: ['payments.create.all', 'payments.create.own'] },
    },
    {
        path: '/payments/:id',
        name: 'payment-detail',
        component: () => import('@/views/payments/PaymentDetailPage.vue'),
        meta,
    },
    {
        path: '/payments/:id/edit',
        name: 'payment-edit',
        component: () => import('@/views/payments/PaymentFormPage.vue'),
        meta: { ...meta, anyPermissions: ['payments.update.all', 'payments.update.own'] },
    },
]
