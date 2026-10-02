import { useClosingRecoveryStore } from '@/stores/closing-recovery'
import { watch } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import { closingsApiKey } from '@/api/closings-api'
import { createHttpClosings } from '@/api/adapters/closings-http'
import { useSessionStore } from '@/stores/session'

export async function configureClosings(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpClosings()
    app.provide(closingsApiKey, api)
    const recovery = useClosingRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot, recovery.review].some(
                        (snapshot) => snapshot && snapshot.actorId !== session.user?.id,
                    ))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
