import { inject } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import { dashboardApiKey } from '@/api/dashboard-api'
import { createHttpDashboard } from '@/api/adapters/dashboard-http'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { adapterModes } from '@/core/constants/environment'
import { useSessionStore } from '@/stores/session'
import { demoRuntimeKey } from './useDemoRuntime'
export async function configureDashboard(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('reports', adapterModes, {
        live: () => createHttpDashboard(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockDashboard } = await import('@/api/adapters/dashboard-mock')
                  const runtime = app.runWithContext(() => inject(demoRuntimeKey))
                  if (!runtime) throw new Error('Demo runtime is not configured')
                  return createMockDashboard(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(dashboardApiKey, api)
}
