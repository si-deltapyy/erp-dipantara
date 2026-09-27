import type { SessionApi, SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { waitForMock } from '@/api/mocks/delay'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import { sessionScenario, sessionStorageAvailable } from '@/api/mocks/session-controls'

const storageKey = 'woodflow.mock.session'
let memoryId: string | null = null

function readId(): string | null {
    if (!sessionStorageAvailable.value) return memoryId
    try {
        return window.sessionStorage.getItem(storageKey)
    } catch {
        sessionStorageAvailable.value = false
        return memoryId
    }
}
function saveId(id: string | null): void {
    memoryId = id
    try {
        if (id) window.sessionStorage.setItem(storageKey, id)
        else window.sessionStorage.removeItem(storageKey)
    } catch {
        sessionStorageAvailable.value = false
    }
}
function publicUser(fixture: SessionUser): SessionUser {
    return {
        id: fixture.id,
        displayName: fixture.displayName,
        roles: [...fixture.roles],
        permissions: sessionScenario.value === 'revoked' ? [] : [...fixture.permissions],
        developmentCapabilities:
            sessionScenario.value === 'revoked' ? [] : [...fixture.developmentCapabilities],
    }
}
async function simulate(signal: AbortSignal): Promise<void> {
    const scenario = sessionScenario.value
    await waitForMock(scenario === 'slow' ? 1800 : 250, signal)
    if (scenario === 'network') throw new ApiError('network')
    if (scenario === 'expired') {
        saveId(null)
        throw new ApiError('unauthenticated')
    }
}
export const sessionMock: SessionApi = {
    async getSession(signal) {
        await simulate(signal)
        const fixture = sessionFixtures.find((user) => user.id === readId())
        if (!fixture) {
            saveId(null)
            return null
        }
        return publicUser(fixture)
    },
    async login(input, signal) {
        await simulate(signal)
        if (sessionScenario.value === 'validation')
            throw new ApiError('validation', { email: ['auth.invalidEmail'] })
        const fixture = sessionFixtures.find(
            (user) => user.email === input.email.trim().toLowerCase(),
        )
        if (!fixture || !input.password || sessionScenario.value === 'invalid')
            throw new ApiError('unauthenticated')
        saveId(fixture.id)
        return publicUser(fixture)
    },
    async logout(signal) {
        await simulate(signal)
        if (sessionScenario.value === 'logout-failure') throw new ApiError('network')
        saveId(null)
    },
    clear() {
        saveId(null)
    },
}
