import { inject } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import { reportsApiKey } from '@/api/reports-api'
import { createHttpReports } from '@/api/adapters/reports-http'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { adapterModes } from '@/core/constants/environment'
import { useSessionStore } from '@/stores/session'
import { demoRuntimeKey } from './useDemoRuntime'
export async function configureReports(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('reports', adapterModes, {
        live: () => createHttpReports(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockReports } = await import('@/api/adapters/reports-mock')
                  const runtime = app.runWithContext(() => inject(demoRuntimeKey))
                  if (!runtime) throw new Error('Demo runtime is not configured')
                  return createMockReports(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(reportsApiKey, api)
}
