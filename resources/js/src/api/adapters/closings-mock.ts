import type { ClosingsApi } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { ClosingRepository } from '@/api/mocks/persistence/closing-repository'
export function createMockClosings(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new ClosingRepository(),
): ClosingsApi {
    return {
        eligibility: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.eligibility(getUser(), id, active),
            ),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
