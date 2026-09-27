import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useOrderRecoveryStore } from '@/stores/order-recovery'
import type { Pinia } from 'pinia'
import { ordersApiKey } from '@/api/orders-api'
import { createHttpOrders } from '@/api/adapters/orders-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureOrders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('orders', adapterModes, {
        live: () => createHttpOrders(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockOrders } = await import('@/api/adapters/orders-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockOrders(runtime, () => session.user)
              }
            : undefined,
    })
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
function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
