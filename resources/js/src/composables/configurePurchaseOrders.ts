import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import type { Pinia } from 'pinia'
import { purchaseOrdersApiKey } from '@/api/purchase-orders-api'
import { createHttpPurchaseOrders } from '@/api/adapters/purchase-orders-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configurePurchaseOrders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('purchase-orders', adapterModes, {
        live: () => createHttpPurchaseOrders(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockPurchaseOrders } =
                      await import('@/api/adapters/purchase-orders-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockPurchaseOrders(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(purchaseOrdersApiKey, api)
    const recovery = usePurchaseOrderRecoveryStore(pinia)
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
function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
