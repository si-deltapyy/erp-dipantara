import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { isRequestCancelled, normalizeApiError } from './api-error'

export function createHttpClient(): AxiosInstance {
    const client = axios.create({
        baseURL: '/',
        timeout: 15000,
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
    client.interceptors.response.use(
        (response) => response,
        (cause: unknown) =>
            Promise.reject(isRequestCancelled(cause) ? cause : normalizeApiError(cause)),
    )
    return client
}
