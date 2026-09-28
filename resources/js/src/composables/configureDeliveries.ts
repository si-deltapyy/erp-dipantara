import { watch } from 'vue'
import type { App } from 'vue'
import { useDeliveryRecoveryStore } from '@/stores/delivery-recovery'
import type { Pinia } from 'pinia'
import { deliveriesApiKey } from '@/api/deliveries-api'
import { createHttpDeliveries } from '@/api/adapters/deliveries-http'
import { useSessionStore } from '@/stores/session'

export async function configureDeliveries(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpDeliveries()
    app.provide(deliveriesApiKey, api)
    const recovery = useDeliveryRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot, recovery.dispatch, recovery.receive].some(
                        (snapshot) => snapshot && snapshot.actorId !== session.user?.id,
                    ))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
