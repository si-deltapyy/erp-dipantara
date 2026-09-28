import type { DashboardApi } from '@/core/types/dashboard'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { DashboardRepository } from '@/api/mocks/persistence/dashboard-repository'
export function createMockDashboard(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new DashboardRepository(),
): DashboardApi {
    return {
        get: (signal) =>
            runtime.executeBusiness('read', signal, (active) => repository.get(getUser(), active)),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
