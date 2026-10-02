import type { RouteRecordRaw } from 'vue-router'
export const authRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginPage.vue'),
        meta: { titleKey: 'auth.title', layout: 'auth' },
    },
    {
        path: '/session-error',
        name: 'session-error',
        component: () => import('@/views/auth/SessionErrorPage.vue'),
        meta: { titleKey: 'auth.bootstrapError', layout: 'auth' },
    },
    {
        path: '/forbidden',
        name: 'forbidden',
        component: () => import('@/views/errors/ForbiddenPage.vue'),
        meta: { titleKey: 'forbidden.title', layout: 'auth', requiresAuth: true },
    },
]
