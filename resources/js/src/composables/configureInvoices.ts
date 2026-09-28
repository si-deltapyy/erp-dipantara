import { watch } from 'vue'
import type { App } from 'vue'
import { useInvoiceRecoveryStore } from '@/stores/invoice-recovery'
import type { Pinia } from 'pinia'
import { invoicesApiKey } from '@/api/invoices-api'
import { createHttpInvoices } from '@/api/adapters/invoices-http'
import { useSessionStore } from '@/stores/session'

export async function configureInvoices(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpInvoices()
    app.provide(invoicesApiKey, api)
    const recovery = useInvoiceRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            if (
                session.status === 'guest' ||
                (session.user &&
                    [recovery.snapshot, recovery.issue, recovery.revision].some(
                        (snapshot) => snapshot && snapshot.actorId !== session.user?.id,
                    ))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
