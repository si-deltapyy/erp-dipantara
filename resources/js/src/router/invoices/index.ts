import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'invoices.title',
    requiresAuth: true,
    ...accessRules['invoices'],
}
export const invoiceRoutes: RouteRecordRaw[] = [
    {
        path: '/invoices/:id/revise',
        name: 'invoice-revise',
        component: () => import('@/views/invoices/InvoiceFormPage.vue'),
        meta: { ...meta, anyPermissions: ['invoices.revise.all'] },
    },
    {
        path: '/invoices',
        name: 'invoices',
        component: () => import('@/views/invoices/InvoiceListPage.vue'),
        meta,
    },
    {
        path: '/invoices/new',
        name: 'invoice-new',
        component: () => import('@/views/invoices/InvoiceFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['invoices.create.all'],
        },
    },
    {
        path: '/invoices/:id',
        name: 'invoice-detail',
        component: () => import('@/views/invoices/InvoiceDetailPage.vue'),
        meta,
    },
    {
        path: '/invoices/:id/edit',
        name: 'invoice-edit',
        component: () => import('@/views/invoices/InvoiceFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['invoices.update.all'],
        },
    },
]
