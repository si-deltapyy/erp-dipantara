import type { App } from 'vue'
import { dashboardApiKey } from '@/api/dashboard-api'
import { createHttpDashboard } from '@/api/adapters/dashboard-http'
export async function configureDashboard(app: App): Promise<void> {
    const api = createHttpDashboard()
    app.provide(dashboardApiKey, api)
}
