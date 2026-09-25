import { beforeEach, expect, test, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { SessionController } from '@/composables/session-controller'
import { useSessionStore } from '@/stores/session'
import { registerSessionGuard } from './session-guard'
import type { SessionUser } from '@/core/types/session'
const user: SessionUser = {
    id: 'grader',
    displayName: 'Grader',
    roles: ['grader'],
    permissions: [],
    developmentCapabilities: [],
}
beforeEach(() => setActivePinia(createPinia()))
const component = { template: '<div />' }
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component,
        meta: {
            titleKey: 'home',
            requiresAuth: true,
            requiredPermissions: [],
        },
    },
    {
        path: '/lab',
        name: 'lab',
        component,
        meta: {
            titleKey: 'lab',
            requiresAuth: true,
            developmentCapability: 'development.ui.view',
        },
    },
    {
        path: '/reports',
        name: 'reports',
        component,
        meta: { titleKey: 'reports', requiresAuth: true, requiredPermissions: ['view reports'] },
    },
    { path: '/login', name: 'login', component, meta: { titleKey: 'login' } },
    { path: '/forbidden', name: 'forbidden', component, meta: { titleKey: 'forbidden' } },
    {
        path: '/session-error',
        name: 'session-error',
        component,
        meta: { titleKey: 'error' },
    },
]
function fixture(current: SessionUser | null) {
    const router = createRouter({ history: createMemoryHistory('/app/'), routes })
    const store = useSessionStore()
    const getSession = vi.fn(async () => current)
    const controller = new SessionController(
        {
            getSession,
            login: async () => user,
            logout: async () => undefined,
            clear: () => undefined,
        },
        store,
    )
    registerSessionGuard(router, controller, store)
    return { router, getSession, store }
}
test('redirects guests with an internal return destination and avoids a login loop', async () => {
    const { router, getSession } = fixture(null)
    await router.push('/lab')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.returnTo).toBe('/app/lab')
    expect(getSession).toHaveBeenCalledTimes(1)
})
test('denies direct routes by capability and permits the home page', async () => {
    const { router } = fixture(user)
    await router.push('/lab')
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
})
test('keeps bootstrap errors out of protected routes', async () => {
    const { router, getSession } = fixture(null)
    getSession.mockRejectedValue(new Error('unavailable'))
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('session-error')
})

test.each([{ roles: ['future'] }, { roles: ['grader', 'maker'] }, { roles: [] }])(
    'permits an explicit permission for roles %s',
    async ({ roles }) => {
        const { router } = fixture({ ...user, roles, permissions: ['view reports'] })
        await router.push('/reports')
        expect(router.currentRoute.value.name).toBe('reports')
    },
)
test('does not bypass permissions for an admin role', async () => {
    const { router } = fixture({ ...user, roles: ['admin'] })
    await router.push('/reports')
    expect(router.currentRoute.value.name).toBe('forbidden')
})
