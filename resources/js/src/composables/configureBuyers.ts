import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useBuyerRecoveryStore } from '@/stores/buyer-recovery'
import type { Pinia } from 'pinia'
import { buyersApiKey } from '@/api/buyers-api'
import { createHttpBuyers } from '@/api/adapters/buyers-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureBuyers(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('master-data', adapterModes, {
        live: () => createHttpBuyers(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockBuyers } = await import('@/api/adapters/buyers-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockBuyers(runtime, () => session.user)
              }
            : undefined,
    })
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
function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
