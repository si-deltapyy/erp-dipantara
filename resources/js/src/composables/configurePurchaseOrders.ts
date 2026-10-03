import { watch } from 'vue'
import type { App } from 'vue'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import type { Pinia } from 'pinia'
import { purchaseOrdersApiKey } from '@/api/purchase-orders-api'
import { createHttpPurchaseOrders } from '@/api/adapters/purchase-orders-http'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'

export async function configurePurchaseOrders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpPurchaseOrders()
    app.provide(purchaseOrdersApiKey, api)
    const recovery = usePurchaseOrderRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    ((recovery.form && recovery.form.actorId !== session.user.id) ||
                        (recovery.snapshot && recovery.snapshot.actorId !== session.user.id) ||
                        (recovery.review && recovery.review.actorId !== session.user.id)))
            )
                recovery.$reset()
            if (
                session.status === 'authenticated' &&
                recovery.review &&
                evaluateRecordAccess(
                    session.user,
                    `purchase-orders.${recovery.review.action}`,
                    recovery.review.order,
                ) !== 'allowed'
            )
                recovery.review = null
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
