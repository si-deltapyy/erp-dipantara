import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useMitraRecoveryStore } from '@/stores/mitra-recovery'
import type { Pinia } from 'pinia'
import { mitrasApiKey } from '@/api/mitras-api'
import { createHttpMitras } from '@/api/adapters/mitras-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureMitras(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('master-data', adapterModes, {
        live: () => createHttpMitras(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockMitras } = await import('@/api/adapters/mitras-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockMitras(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(mitrasApiKey, api)
    const recovery = useMitraRecoveryStore(pinia)
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
