import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useAssignmentRecoveryStore } from '@/stores/assignment-recovery'
import type { Pinia } from 'pinia'
import { assignmentsApiKey } from '@/api/assignments-api'
import { createHttpAssignments } from '@/api/adapters/assignments-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureAssignments(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('orders', adapterModes, {
        live: () => createHttpAssignments(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockAssignments } = await import('@/api/adapters/assignments-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockAssignments(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(assignmentsApiKey, api)
    const recovery = useAssignmentRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
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
