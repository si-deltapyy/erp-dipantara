import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { sessionMock } from './session-mock'
import { sessionScenario, sessionStorageAvailable } from '@/api/mocks/session-controls'
beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    sessionMock.clear()
    sessionScenario.value = 'success'
    sessionStorageAvailable.value = true
})
afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})
const signal = (): AbortSignal => new AbortController().signal
test('persists only a synthetic id, restores it, and removes it on logout', async () => {
    const login = sessionMock.login(
        { email: 'admin@woodflow.test', password: 'temporary-simulation' },
        signal(),
    )
    await vi.runAllTimersAsync()
    expect(await login).toMatchObject({ roles: ['admin'] })
    expect(sessionStorage.length).toBe(1)
    expect(sessionStorage.getItem('woodflow.mock.session')).toBe('admin-demo')
    const current = sessionMock.getSession(signal())
    await vi.runAllTimersAsync()
    expect(await current).toMatchObject({ id: 'admin-demo' })
    const logout = sessionMock.logout(signal())
    await vi.runAllTimersAsync()
    await logout
    expect(sessionStorage.length).toBe(0)
})
test.each(['invalid', 'validation', 'network', 'expired'] as const)(
    'exposes %s failure without persisting credentials',
    async (scenario) => {
        sessionScenario.value = scenario
        const login = sessionMock.login(
            { email: 'admin@woodflow.test', password: 'simulation' },
            signal(),
        )
        const assertion = expect(login).rejects.toBeInstanceOf(Error)
        await vi.runAllTimersAsync()
        await assertion
        expect(sessionStorage.length).toBe(0)
    },
)
test('does not store a canceled login', async () => {
    const request = new AbortController()
    const login = sessionMock.login(
        { email: 'grader1@woodflow.test', password: 'simulation' },
        request.signal,
    )
    const assertion = expect(login).rejects.toMatchObject({ name: 'AbortError' })
    request.abort()
    await assertion
    expect(sessionStorage.length).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
})
test('treats an unknown persisted id as guest', async () => {
    sessionStorage.setItem('woodflow.mock.session', 'tampered')
    const current = sessionMock.getSession(signal())
    await vi.runAllTimersAsync()
    expect(await current).toBeNull()
})
test('falls back to memory when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('unavailable')
    })
    const login = sessionMock.login(
        { email: 'grader2@woodflow.test', password: 'simulation' },
        signal(),
    )
    await vi.runAllTimersAsync()
    await login
    const current = sessionMock.getSession(signal())
    await vi.runAllTimersAsync()
    expect(await current).toMatchObject({ id: 'grader-two' })
    expect(sessionStorageAvailable.value).toBe(false)
})

test('uses memory when storage reads work but writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
    })
    const login = sessionMock.login(
        { email: 'admin@woodflow.test', password: 'simulation' },
        signal(),
    )
    await vi.runAllTimersAsync()
    await login
    const current = sessionMock.getSession(signal())
    await vi.runAllTimersAsync()
    expect(await current).toMatchObject({ id: 'admin-demo' })
    expect(sessionStorageAvailable.value).toBe(false)
})

test('returns no permissions or lab capabilities after revocation', async () => {
    const pending = sessionMock.login(
        { email: 'admin@woodflow.test', password: 'simulation' },
        new AbortController().signal,
    )
    await vi.runAllTimersAsync()
    await pending
    sessionScenario.value = 'revoked'
    const refreshed = sessionMock.getSession(new AbortController().signal)
    await vi.runAllTimersAsync()
    expect(await refreshed).toMatchObject({
        roles: ['admin'],
        permissions: [],
        developmentCapabilities: [],
    })
})
