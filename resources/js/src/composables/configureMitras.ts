import { watch } from 'vue'
import type { App } from 'vue'
import { useMitraRecoveryStore } from '@/stores/mitra-recovery'
import type { Pinia } from 'pinia'
import { mitrasApiKey } from '@/api/mitras-api'
import { createHttpMitras } from '@/api/adapters/mitras-http'
import { useSessionStore } from '@/stores/session'

export async function configureMitras(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpMitras()
    app.provide(mitrasApiKey, api)
    const recovery = useMitraRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user?.id],
        () => {
            if (
                session.status === 'guest' ||
                (session.user && recovery.snapshot?.actorId !== session.user.id)
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
