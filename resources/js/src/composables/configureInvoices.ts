import { inject } from 'vue'
import type { App } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import type { Pinia } from 'pinia'
import { invoicesApiKey } from '@/api/invoices-api'
import { createHttpInvoices } from '@/api/adapters/invoices-http'
import { adapterModes } from '@/core/constants/environment'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { demoRuntimeKey } from './useDemoRuntime'
import { useSessionStore } from '@/stores/session'

export async function configureInvoices(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('invoices', adapterModes, {
        live: () => createHttpInvoices(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockInvoices } = await import('@/api/adapters/invoices-mock')
                  const runtime = app.runWithContext(() => injectRuntime())
                  return createMockInvoices(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(invoicesApiKey, api)
}

function injectRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
