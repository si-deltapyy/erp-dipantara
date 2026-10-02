import type { AxiosInstance } from 'axios'
import type { SessionApi } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseSession } from '@/api/session-mapper'
import { createHttpClient } from '@/services/http-client'

export function createHttpSession(client: AxiosInstance = createHttpClient()): SessionApi {
    return {
        async getSession(signal) {
            const response = await client.get<unknown>('/auth/session', { signal })
            return parseSession(response.data)
        },
        async login(input, signal) {
            const response = await client.post<unknown>('/login', input, { signal })
            const user = parseSession(response.data)
            if (!user) throw new ApiError('unexpected')
            return user
        },
        async logout(signal) {
            await client.post('/logout', {}, { signal })
        },
        clear() {},
    }
}
