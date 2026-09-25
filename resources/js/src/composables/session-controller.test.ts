import { beforeEach, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SessionController } from './session-controller'
import { useSessionStore } from '@/stores/session'
import type { SessionApi, SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'

const user: SessionUser = {
    id: 'admin',
    displayName: 'Admin',
    roles: ['admin'],
    permissions: [],
    developmentCapabilities: [],
}
beforeEach(() => setActivePinia(createPinia()))
function deferred<T>(): {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (cause: unknown) => void
} {
    let resolve!: (value: T) => void
    let reject!: (cause: unknown) => void
    const promise = new Promise<T>((accept, decline) => {
        resolve = accept
        reject = decline
    })
    return { promise, resolve, reject }
}
function fixture(overrides: Partial<SessionApi> = {}): {
    api: SessionApi
    store: ReturnType<typeof useSessionStore>
    controller: SessionController
} {
    const api: SessionApi = {
        getSession: vi.fn(async () => null),
        login: vi.fn(async () => user),
        logout: vi.fn(async () => undefined),
        clear: vi.fn(),
        ...overrides,
    }
    const store = useSessionStore()
    return { api, store, controller: new SessionController(api, store) }
}
test('shares a single bootstrap and waits before publishing the user', async () => {
    const response = deferred<SessionUser>()
    const { api, store, controller } = fixture({ getSession: vi.fn(() => response.promise) })
    const first = controller.ensure()
    const second = controller.ensure()
    expect(first).toBe(second)
    expect(store.status).toBe('loading')
    expect(store.user).toBeNull()
    response.resolve(user)
    await first
    expect(api.getSession).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('authenticated')
})
test('does not restore an expired session from a late bootstrap', async () => {
    const response = deferred<SessionUser>()
    const { store, controller } = fixture({ getSession: () => response.promise })
    const pending = controller.ensure()
    controller.expire()
    response.resolve(user)
    await pending
    expect(store.status).toBe('guest')
    expect(store.user).toBeNull()
})
test('keeps bootstrap network errors distinct from guests and permits retry', async () => {
    const getSession = vi
        .fn<SessionApi['getSession']>()
        .mockRejectedValueOnce(new ApiError('network'))
        .mockResolvedValueOnce(user)
    const { store, controller } = fixture({ getSession })
    await controller.ensure()
    expect(store.status).toBe('error')
    await controller.refresh()
    expect(store.user?.id).toBe('admin')
})
test('ignores a stale error after a newer session bootstrap', async () => {
    const old = deferred<SessionUser>()
    const getSession = vi
        .fn<SessionApi['getSession']>()
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce(user)
    const { store, controller } = fixture({ getSession })
    const pending = controller.ensure()
    await controller.refresh()
    old.reject(new ApiError('network'))
    await pending
    expect(store.status).toBe('authenticated')
})
test('prevents duplicate login and ignores login after expiry', async () => {
    const response = deferred<SessionUser>()
    const { store, controller, api } = fixture({ login: vi.fn(() => response.promise) })
    const first = controller.login({ email: 'admin@woodflow.test', password: 'simulation' })
    expect(await controller.login({ email: 'admin@woodflow.test', password: 'simulation' })).toBe(
        false,
    )
    controller.expire()
    response.resolve(user)
    expect(await first).toBe(false)
    expect(api.login).toHaveBeenCalledTimes(1)
    expect(store.user).toBeNull()
    expect(store.pending).toBe(false)
})
test('preserves identity on failed logout and clears it on successful retry', async () => {
    const logout = vi
        .fn<SessionApi['logout']>()
        .mockRejectedValueOnce(new ApiError('network'))
        .mockResolvedValueOnce()
    const { store, controller, api } = fixture({ logout })
    store.$patch({ user, status: 'authenticated' })
    await expect(controller.logout()).rejects.toMatchObject({ kind: 'network' })
    expect(store.user?.id).toBe('admin')
    expect(store.pending).toBe(false)
    await controller.logout()
    expect(store.status).toBe('guest')
    expect(api.clear).toHaveBeenCalledTimes(1)
})
test('logout while bootstrap is pending prevents late restoration', async () => {
    const response = deferred<SessionUser>()
    const { store, controller } = fixture({ getSession: () => response.promise })
    const pending = controller.ensure()
    await controller.logout()
    response.resolve(user)
    await pending
    expect(store.status).toBe('guest')
})
test('turns an expired bootstrap into a guest and cancels pending login on disposal', async () => {
    const { store, controller } = fixture({
        getSession: async () => {
            throw new ApiError('unauthenticated')
        },
    })
    await controller.ensure()
    expect(store.status).toBe('guest')
    const pending = controller.login({ email: 'admin@woodflow.test', password: 'simulation' })
    controller.cancel()
    expect(await pending).toBe(false)
    expect(store.pending).toBe(false)
})

test('ignores a canceled login error after a newer login succeeds', async () => {
    const old = deferred<SessionUser>()
    const login = vi
        .fn<SessionApi['login']>()
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce(user)
    const { store, controller } = fixture({ login })
    const pending = controller.login({ email: 'grader1@woodflow.test', password: 'simulation' })
    controller.cancel()
    await controller.login({ email: 'admin@woodflow.test', password: 'simulation' })
    old.reject(new ApiError('network'))
    expect(await pending).toBe(false)
    expect(store.user?.id).toBe('admin')
    expect(store.pending).toBe(false)
})
test('refresh cancels a mutation without leaving pending state behind', async () => {
    const old = deferred<SessionUser>()
    const { store, controller } = fixture({ login: () => old.promise })
    const pending = controller.login({ email: 'admin@woodflow.test', password: 'simulation' })
    await controller.refresh()
    old.resolve(user)
    expect(await pending).toBe(false)
    expect(store.status).toBe('guest')
    expect(store.pending).toBe(false)
})

test('refreshes CSRF after a rejected login without replaying credentials', async () => {
    const login = vi.fn<SessionApi['login']>().mockRejectedValue(new ApiError('csrf'))
    const { controller, store, api } = fixture({ login })
    await expect(
        controller.login({ email: 'example@woodflow.test', password: 'simulation' }),
    ).rejects.toMatchObject({ kind: 'csrf' })
    expect(login).toHaveBeenCalledTimes(1)
    expect(api.getSession).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('guest')
    expect(store.pending).toBe(false)
})
test('refreshes a rejected logout without pretending the server logged out', async () => {
    const logout = vi.fn<SessionApi['logout']>().mockRejectedValue(new ApiError('csrf'))
    const { controller, store } = fixture({ logout, getSession: async () => user })
    store.$patch({ user, status: 'authenticated' })
    await expect(controller.logout()).rejects.toMatchObject({ kind: 'csrf' })
    expect(logout).toHaveBeenCalledTimes(1)
    expect(store.user).toEqual(user)
})
test('handles domain authentication failures without coupling transport to routing', async () => {
    const { controller, store } = fixture({ getSession: async () => user })
    await controller.handleRequestFailure(new ApiError('csrf'))
    expect(store.status).toBe('authenticated')
    await controller.handleRequestFailure(new ApiError('unauthenticated'))
    expect(store.status).toBe('guest')
})

test('ignores an old CSRF recovery after a newer login succeeds', async () => {
    const recovery = deferred<SessionUser>()
    const login = vi
        .fn<SessionApi['login']>()
        .mockRejectedValueOnce(new ApiError('csrf'))
        .mockResolvedValueOnce(user)
    const getSession = vi.fn(() => recovery.promise)
    const { controller, store } = fixture({ login, getSession })
    const old = controller.login({ email: 'example@woodflow.test', password: 'simulation' })
    await vi.waitFor(() => expect(getSession).toHaveBeenCalledTimes(1))
    controller.cancel()
    await controller.login({ email: 'example@woodflow.test', password: 'simulation' })
    recovery.resolve({ ...user, id: 'old' })
    expect(await old).toBe(false)
    expect(store.user?.id).toBe('admin')
    expect(store.pending).toBe(false)
})
