import type { App } from 'vue'
import { reportsApiKey } from '@/api/reports-api'
import { createHttpReports } from '@/api/adapters/reports-http'
export async function configureReports(app: App): Promise<void> {
    const api = createHttpReports()
    app.provide(reportsApiKey, api)
}
