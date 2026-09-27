import type { OrderWriteOptions } from '@/core/types/order'
import type { AssignmentsApi, Assignment } from '@/core/types/assignment'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { AssignmentRepository } from '@/api/mocks/persistence/assignment-repository'
import type { AssignmentMutation } from '@/api/mocks/persistence/assignment-mutation'
import { requireAssignmentPermission } from '@/api/mocks/assignment-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockAssignments(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new AssignmentRepository(),
): AssignmentsApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<AssignmentMutation, 'key' | 'hash'>,
        options: OrderWriteOptions,
    ): Promise<Assignment> {
        const actor = requireAssignmentPermission(getUser(), mutation.action)
        try {
            return await runtime.executeBusiness('update', options.signal, (signal, generation) => {
                if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                const identity = `${actor.id}:${options.idempotencyKey}`
                const snapshot =
                    generations.get(identity) ?? options.snapshotGeneration ?? generation
                generations.set(identity, snapshot)
                return repository.mutate(
                    getUser(),
                    { ...mutation, key: options.idempotencyKey },
                    snapshot,
                    signal,
                )
            })
        } catch (cause) {
            if (
                cause instanceof ApiError &&
                cause.kind === 'validation' &&
                'quantity' in cause.fieldErrors
            )
                throw new ApiError('validation', {
                    quantity: ['assignments.invalid'],
                })
            throw cause
        }
    }
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
        create: (input, options) => mutate({ action: 'create', input }, options),
        update: (id, input, options) => mutate({ action: 'update', id, input }, options),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
