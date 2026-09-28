import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { usePaymentRecoveryStore } from '@/stores/payment-recovery'
import type { Pinia } from 'pinia'
import { paymentsApiKey } from '@/api/payments-api'
import { createHttpPayments } from '@/api/adapters/payments-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configurePayments(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('payments', adapterModes, {
        live: () => createHttpPayments(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockPayments } = await import('@/api/adapters/payments-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockPayments(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(paymentsApiKey, api)
    const recovery = usePaymentRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot, recovery.submit, recovery.review].some(
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
