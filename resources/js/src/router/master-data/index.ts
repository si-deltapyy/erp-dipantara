import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'

export const masterDataRoutes: readonly RouteRecordRaw[] = [
    {
        path: '/master-data/timber-products',
        name: 'timber-products',
        component: () => import('@/views/master-data/timber-products/TimberProductListPage.vue'),
        meta: {
            titleKey: 'timber-products.title',
            requiresAuth: true,
            ...accessRules['timber-products'],
        },
    },
    {
        path: '/master-data/mitras',
        name: 'mitras',
        component: () => import('@/views/master-data/mitras/MitraListPage.vue'),
        meta: { titleKey: 'mitras.title', requiresAuth: true, ...accessRules.mitras },
    },
    {
        path: '/master-data/buyers',
        name: 'buyers',
        component: () => import('@/views/master-data/buyers/BuyerListPage.vue'),
        meta: { titleKey: 'buyers.title', requiresAuth: true, ...accessRules.buyers },
    },
]
