import { watch } from 'vue'
import type { App } from 'vue'
import { useAssignmentRecoveryStore } from '@/stores/assignment-recovery'
import type { Pinia } from 'pinia'
import { assignmentsApiKey } from '@/api/assignments-api'
import { createHttpAssignments } from '@/api/adapters/assignments-http'
import { useSessionStore } from '@/stores/session'

export async function configureAssignments(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpAssignments()
    app.provide(assignmentsApiKey, api)
    const recovery = useAssignmentRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
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
