import { ReportExportRepository } from '@/api/mocks/persistence/report-export-repository'
import { requireExportActor } from '@/api/mocks/persistence/report-export-policy'
import { ApiError } from '@/core/types/api-error'
import type { ReportsApi } from '@/core/types/report'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { ReportRepository } from '@/api/mocks/persistence/report-repository'
export function createMockReports(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new ReportRepository(),
    exports = new ReportExportRepository(),
): ReportsApi {
    const generations = new Map<string, string>()
    return {
        export: (input, options) => {
            const actor = requireExportActor(getUser(), input.kind)
            return runtime.executeBusiness('update', options.signal, (active, generation) => {
                if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                const identity = `${actor.id}:${options.idempotencyKey}`
                const snapshot = generations.get(identity) ?? generation
                generations.set(identity, snapshot)
                return exports.create(getUser(), input, options.idempotencyKey, snapshot, active)
            })
        },
        purchasePrices: (query, signal) =>
            runtime.executeBusiness('read', signal, async (active, _generation, scenario) => {
                const response = await repository.purchasePrices(getUser(), query, active)
                return scenario === 'empty'
                    ? { data: [], meta: { ...response.meta, total: 0 } }
                    : response
            }),
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
