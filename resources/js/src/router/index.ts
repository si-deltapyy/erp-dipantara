import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { DevelopmentCapability } from '@/core/types/session'
import { accessRules } from './access-rules'
import { authRoutes } from './auth-routes'
import { masterDataRoutes } from './master-data'
import { i18n } from '@/locales'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/home/HomePage.vue'),
        meta: {
            titleKey: 'navigation.home',
            requiresAuth: true,
            ...accessRules.home,
        },
    },
]

routes.push(...authRoutes, ...masterDataRoutes)

routes.push({
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundPage.vue'),
    meta: { titleKey: 'notFound.title', layout: 'auth' },
})

export const router = createRouter({
    history: createWebHistory('/app/'),
    routes,
    scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((route) => {
    document.title = `${i18n.global.t(route.meta.titleKey ?? 'brand.name')} · WoodFlow`
})

declare module 'vue-router' {
    interface RouteMeta {
        titleKey: string
        layout?: 'auth' | 'app'
        requiresAuth?: boolean
        requiredPermissions?: readonly string[]
        developmentCapability?: DevelopmentCapability
    }
}
