import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useTimberProductRecoveryStore } from '@/stores/timber-product-recovery'
import type { Pinia } from 'pinia'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { createHttpTimberProducts } from '@/api/adapters/timber-products-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureTimberProducts(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('master-data', adapterModes, {
        live: () => createHttpTimberProducts(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockTimberProducts } =
                      await import('@/api/adapters/timber-products-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockTimberProducts(runtime, () => session.user)
              }
            : undefined,
    })
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
function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
