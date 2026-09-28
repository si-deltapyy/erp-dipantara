import type { DeliveriesApi, Delivery } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import type { DeliveryMutation } from '@/api/mocks/persistence/delivery-mutation'
import { DeliveryRepository } from '@/api/mocks/persistence/delivery-repository'
import { requireDeliveryPermission } from '@/api/mocks/delivery-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockDeliveries(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new DeliveryRepository(),
): DeliveriesApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<DeliveryMutation, 'key' | 'hash'>,
        options: WorkflowWriteOptions,
    ): Promise<Delivery> {
        const actor = requireDeliveryPermission(getUser(), mutation.action)
        return runtime.executeBusiness('update', options.signal, (signal, generation) => {
            if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
            const identity = `${actor.id}:${options.idempotencyKey}`
            const snapshot = generations.get(identity) ?? options.snapshotGeneration ?? generation
            generations.set(identity, snapshot)
            return repository.mutate(
                getUser(),
                { ...mutation, key: options.idempotencyKey },
                snapshot,
                signal,
            )
        })
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
        availability: (query, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.availability(getUser(), query, active),
            ),
        create: (input, options) => mutate({ action: 'create', input }, options),
        update: (id, input, options) => mutate({ action: 'update', id, input }, options),
        dispatch: (id, input, options) => mutate({ action: 'dispatch', id, input }, options),
        receive: (id, input, options) => mutate({ action: 'receive', id, input }, options),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
