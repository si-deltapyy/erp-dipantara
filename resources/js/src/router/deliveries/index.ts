import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'deliveries.title',
    requiresAuth: true,
    ...accessRules['deliveries'],
}
export const deliveryRoutes: RouteRecordRaw[] = [
    {
        path: '/deliveries',
        name: 'deliveries',
        component: () => import('@/views/deliveries/DeliveryListPage.vue'),
        meta,
    },
    {
        path: '/deliveries/new',
        name: 'delivery-new',
        component: () => import('@/views/deliveries/DeliveryFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['deliveries.create.all'],
        },
    },
    {
        path: '/deliveries/:id',
        name: 'delivery-detail',
        component: () => import('@/views/deliveries/DeliveryDetailPage.vue'),
        meta,
    },
    {
        path: '/deliveries/:id/edit',
        name: 'delivery-edit',
        component: () => import('@/views/deliveries/DeliveryFormPage.vue'),
        meta: {
            ...meta,
            anyPermissions: ['deliveries.update.all'],
        },
    },
]
