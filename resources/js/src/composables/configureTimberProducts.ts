import { watch } from 'vue'
import type { App } from 'vue'
import { useTimberProductRecoveryStore } from '@/stores/timber-product-recovery'
import type { Pinia } from 'pinia'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { createHttpTimberProducts } from '@/api/adapters/timber-products-http'
import { useSessionStore } from '@/stores/session'

export async function configureTimberProducts(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpTimberProducts()
    app.provide(timberProductsApiKey, api)
    const recovery = useTimberProductRecoveryStore(pinia)
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
