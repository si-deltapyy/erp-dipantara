import { watch } from 'vue'
import type { App } from 'vue'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import type { Pinia } from 'pinia'
import { gradingsApiKey } from '@/api/gradings-api'
import { createHttpGradings } from '@/api/adapters/gradings-http'
import { useSessionStore } from '@/stores/session'

export async function configureGradings(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpGradings()
    app.provide(gradingsApiKey, api)
    const recovery = useGradingRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [
                        recovery.snapshot,
                        recovery.review,
                        recovery.submission,
                        recovery.revision,
                    ].some((snapshot) => snapshot && snapshot.actorId !== session.user?.id))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
