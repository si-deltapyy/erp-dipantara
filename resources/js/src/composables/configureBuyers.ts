import { watch } from 'vue'
import type { App } from 'vue'
import { useBuyerRecoveryStore } from '@/stores/buyer-recovery'
import type { Pinia } from 'pinia'
import { buyersApiKey } from '@/api/buyers-api'
import { createHttpBuyers } from '@/api/adapters/buyers-http'
import { useSessionStore } from '@/stores/session'

export async function configureBuyers(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpBuyers()
    app.provide(buyersApiKey, api)
    const recovery = useBuyerRecoveryStore(pinia)
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
