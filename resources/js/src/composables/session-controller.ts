import type { LoginInput, SessionApi } from '@/core/types/session'
import type { useSessionStore } from '@/stores/session'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

type SessionStore = ReturnType<typeof useSessionStore>
export class SessionController {
    private current: AbortController | undefined
    private bootstrap: Promise<void> | undefined
    constructor(
        private readonly api: SessionApi,
        private readonly store: SessionStore,
    ) {}
    private start(): AbortController {
        this.current?.abort()
        this.bootstrap = undefined
        this.store.pending = false
        const request = new AbortController()
        this.current = request
        return request
    }
    ensure(): Promise<void> {
        if (this.bootstrap) return this.bootstrap
        if (this.store.status !== 'unknown') return Promise.resolve()
        return this.refresh()
    }
    refresh(): Promise<void> {
        const request = this.start()
        this.store.$patch({ status: 'loading', user: null })
        const pending = this.load(request).finally(() => {
            if (this.bootstrap === pending) this.bootstrap = undefined
        })
        this.bootstrap = pending
        return pending
    }
    private async load(request: AbortController): Promise<void> {
        try {
            const user = await this.api.getSession(request.signal)
            if (!request.signal.aborted)
                this.store.$patch({ user, status: user ? 'authenticated' : 'guest' })
        } catch (cause: unknown) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            if (normalizeApiError(cause).kind === 'unauthenticated') this.expire()
            else this.store.$patch({ user: null, status: 'error' })
        }
    }
    async login(input: LoginInput): Promise<boolean> {
        if (this.store.pending) return false
        const request = this.start()
        this.store.pending = true
        try {
            const user = await this.api.login(input, request.signal)
            if (request.signal.aborted) return false
            this.store.$patch({ user, status: 'authenticated' })
            return true
        } catch (cause: unknown) {
            if (request.signal.aborted || isRequestCancelled(cause)) return false
            if (await this.recoverFailure(cause, request)) return false
            throw cause
        } finally {
            if (this.current === request) this.store.pending = false
        }
    }
    async logout(): Promise<boolean> {
        if (this.store.pending) return false
        const request = this.start()
        this.store.pending = true
        try {
            await this.api.logout(request.signal)
            if (request.signal.aborted) return false
            this.expire()
            return true
        } catch (cause: unknown) {
            if (request.signal.aborted || isRequestCancelled(cause)) return false
            if (!request.signal.aborted && normalizeApiError(cause).kind === 'unauthenticated') {
                this.expire()
                return true
            }
            if (await this.recoverFailure(cause, request)) return false
            throw cause
        } finally {
            if (this.current === request) this.store.pending = false
        }
    }
    private async recoverFailure(cause: unknown, request: AbortController): Promise<boolean> {
        const failure = normalizeApiError(cause)
        if (failure.kind === 'csrf') {
            await this.load(request)
            return request.signal.aborted
        }
        if (failure.kind === 'unauthenticated') this.expire()
        return false
    }
    async handleRequestFailure(cause: unknown): Promise<void> {
        const failure = normalizeApiError(cause)
        if (failure.kind === 'unauthenticated') this.expire()
        else if (failure.kind === 'csrf') await this.refresh()
    }
    expire(): void {
        this.current?.abort()
        this.bootstrap = undefined
        this.api.clear()
        this.store.$patch({ user: null, status: 'guest', pending: false })
    }
    cancel(): void {
        this.current?.abort()
        this.store.pending = false
    }
}
