import type { SessionApi } from '@/core/types/session'
export function createSessionApi(adapter: SessionApi): SessionApi {
    return {
        getSession: (signal) => adapter.getSession(signal),
        login: (input, signal) => adapter.login(input, signal),
        logout: (signal) => adapter.logout(signal),
        clear: () => adapter.clear(),
    }
}
