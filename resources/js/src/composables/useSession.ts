import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { SessionController } from './session-controller'
export const sessionKey: InjectionKey<SessionController> = Symbol('session')
export function useSession(): SessionController {
    const controller = inject(sessionKey)
    if (!controller) throw new Error('Session controller is not configured')
    return controller
}
