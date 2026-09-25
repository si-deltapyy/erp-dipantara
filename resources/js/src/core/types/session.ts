export type DevelopmentCapability = 'development.mock.view' | 'development.ui.view'
export type SessionStatus = 'unknown' | 'loading' | 'authenticated' | 'guest' | 'error'
export interface SessionUser {
    readonly id: string
    readonly displayName: string
    readonly roles: readonly string[]
    readonly permissions: readonly string[]
    readonly developmentCapabilities: readonly DevelopmentCapability[]
}
export type SessionSnapshot = SessionUser | null
export interface LoginInput {
    readonly email: string
    readonly password: string
}
export interface SessionApi {
    getSession(signal: AbortSignal): Promise<SessionSnapshot>
    login(input: LoginInput, signal: AbortSignal): Promise<SessionUser>
    logout(signal: AbortSignal): Promise<void>
    clear(): void
}
