import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useDeliveryRecoveryStore } from '@/stores/delivery-recovery'
import type { Pinia } from 'pinia'
import { deliveriesApiKey } from '@/api/deliveries-api'
import { createHttpDeliveries } from '@/api/adapters/deliveries-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureDeliveries(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('deliveries', adapterModes, {
        live: () => createHttpDeliveries(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockDeliveries } = await import('@/api/adapters/deliveries-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockDeliveries(runtime, () => session.user)
              }
            : undefined,
    })
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
function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
