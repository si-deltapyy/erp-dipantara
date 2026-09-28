import type { ReportsApi } from '@/core/types/report'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { ReportRepository } from '@/api/mocks/persistence/report-repository'
export function createMockReports(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new ReportRepository(),
): ReportsApi {
    return {
        production: (query, signal) =>
            runtime.executeBusiness('read', signal, async (active, _generation, scenario) => {
                const response = await repository.production(getUser(), query, active)
                return scenario === 'empty'
                    ? { data: [], meta: { ...response.meta, total: 0 } }
                    : response
            }),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
