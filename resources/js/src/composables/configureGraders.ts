import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import type { Pinia } from 'pinia'
import { gradersApiKey } from '@/api/graders-api'
import { createHttpGraders } from '@/api/adapters/graders-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureGraders(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('master-data', adapterModes, {
        live: () => createHttpGraders(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockGraders } = await import('@/api/adapters/graders-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockGraders(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(gradersApiKey, api)
    const recovery = useGraderRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user?.id],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot?.actorId, recovery.provision?.actorId].some(
                        (actorId) => actorId !== undefined && actorId !== session.user?.id,
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
