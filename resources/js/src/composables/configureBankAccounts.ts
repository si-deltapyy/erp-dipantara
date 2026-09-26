import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { useBankAccountRecoveryStore } from '@/stores/bank-account-recovery'
import type { Pinia } from 'pinia'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import { createHttpBankAccounts } from '@/api/adapters/bank-accounts-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureBankAccounts(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('master-data', adapterModes, {
        live: () => createHttpBankAccounts(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockBankAccounts } =
                      await import('@/api/adapters/bank-accounts-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockBankAccounts(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(bankAccountsApiKey, api)
    const recovery = useBankAccountRecoveryStore(pinia)
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
