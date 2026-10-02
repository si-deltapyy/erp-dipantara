import { watch } from 'vue'
import type { App } from 'vue'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import type { Pinia } from 'pinia'
import { ordersApiKey } from '@/api/orders-api'
import { createHttpOrders } from '@/api/adapters/orders-http'
import { useSessionStore } from '@/stores/session'

export async function configureOrders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpOrders()
    app.provide(ordersApiKey, api)
    const recovery = useOrderRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot, recovery.review, recovery.submission].some(
                        (snapshot) => snapshot && snapshot.actorId !== session.user?.id,
                    ))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
