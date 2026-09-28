import { watch } from 'vue'
import type { App } from 'vue'
import { useBankAccountRecoveryStore } from '@/stores/bank-account-recovery'
import type { Pinia } from 'pinia'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import { createHttpBankAccounts } from '@/api/adapters/bank-accounts-http'
import { useSessionStore } from '@/stores/session'

export async function configureBankAccounts(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpBankAccounts()
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
