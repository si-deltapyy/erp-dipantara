import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import type { Pinia } from 'pinia'
import { gradingsApiKey } from '@/api/gradings-api'
import { createHttpGradings } from '@/api/adapters/gradings-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureGradings(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('gradings', adapterModes, {
        live: () => createHttpGradings(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockGradings } = await import('@/api/adapters/gradings-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockGradings(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(gradingsApiKey, api)
    const recovery = useGradingRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [
                        recovery.snapshot,
                        recovery.review,
                        recovery.submission,
                        recovery.revision,
                    ].some((snapshot) => snapshot && snapshot.actorId !== session.user?.id))
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
