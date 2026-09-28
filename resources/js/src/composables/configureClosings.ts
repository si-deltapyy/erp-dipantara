import { useClosingRecoveryStore } from '@/stores/closing-recovery'
import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import type { Pinia } from 'pinia'
import { closingsApiKey } from '@/api/closings-api'
import { createHttpClosings } from '@/api/adapters/closings-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureClosings(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('closings', adapterModes, {
        live: () => createHttpClosings(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockClosings } = await import('@/api/adapters/closings-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockClosings(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(closingsApiKey, api)
    const recovery = useClosingRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user && recovery.snapshot && recovery.snapshot.actorId !== session.user.id)
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
