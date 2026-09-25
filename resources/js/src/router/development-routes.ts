import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from './access-rules'
export const developmentRoutes: RouteRecordRaw[] = [
    {
        path: '/development/mock',
        name: 'mock-lab',
        component: () => import('@/views/development/MockLabPage.vue'),
        meta: {
            titleKey: 'navigation.lab',
            requiresAuth: true,
            ...accessRules['mock-lab'],
        },
    },
    {
        path: '/development/ui',
        name: 'ui-lab',
        component: () => import('@/views/development/UiLabPage.vue'),
        meta: {
            titleKey: 'ui.title',
            requiresAuth: true,
            ...accessRules['ui-lab'],
        },
    },
]
