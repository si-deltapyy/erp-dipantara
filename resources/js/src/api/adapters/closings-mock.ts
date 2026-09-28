import { requireClosingPermission } from '@/api/mocks/persistence/closing-policy'
import { ApiError } from '@/core/types/api-error'
import type { ClosingsApi } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { ClosingRepository } from '@/api/mocks/persistence/closing-repository'
export function createMockClosings(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new ClosingRepository(),
): ClosingsApi {
    const generations = new Map<string, string>()
    return {
        list: (query, signal) =>
            runtime.executeBusiness('read', signal, async (active, _generation, scenario) => {
                const response = await repository.list(getUser(), query, active)
                return scenario === 'empty'
                    ? { data: [], meta: { ...response.meta, total: 0 } }
                    : response
            }),
        get: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.get(getUser(), id, active),
            ),
        create: (input, options) => {
            const actor = requireClosingPermission(getUser(), 'request')
            return runtime.executeBusiness('update', options.signal, (active, generation) => {
                if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                const identity = `${actor.id}:${options.idempotencyKey}`
                const snapshot =
                    generations.get(identity) ?? options.snapshotGeneration ?? generation
                generations.set(identity, snapshot)
                return repository.create(getUser(), input, options.idempotencyKey, snapshot, active)
            })
        },
        eligibility: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.eligibility(getUser(), id, active),
            ),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
