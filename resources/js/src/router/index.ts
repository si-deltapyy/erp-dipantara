import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { mockEnabled } from '@/core/constants/environment'
import { i18n } from '@/locales'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/home/HomePage.vue'),
        meta: { titleKey: 'navigation.home' },
    },
]

if (mockEnabled) {
    routes.push({
        path: '/development/mock',
        name: 'mock-lab',
        component: () => import('@/views/development/MockLabPage.vue'),
        meta: { titleKey: 'navigation.lab' },
    })
}
routes.push({
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundPage.vue'),
    meta: { titleKey: 'notFound.title' },
})

export const router = createRouter({
    history: createWebHistory('/app/'),
    routes,
    scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((route) => {
    document.title = `${i18n.global.t(route.meta.titleKey)} · WoodFlow`
})

declare module 'vue-router' {
    interface RouteMeta {
        titleKey: string
    }
}
