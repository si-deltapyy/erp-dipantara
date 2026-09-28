import { watch } from 'vue'
import type { App } from 'vue'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import type { Pinia } from 'pinia'
import { gradersApiKey } from '@/api/graders-api'
import { createHttpGraders } from '@/api/adapters/graders-http'
import { useSessionStore } from '@/stores/session'

export async function configureGraders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpGraders()
    app.provide(gradersApiKey, api)
    const recovery = useGraderRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user?.id],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot?.actorId, recovery.provision?.actorId].some(
                        (actorId) => actorId !== undefined && actorId !== session.user?.id,
                    ))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
