import type {
    PurchaseOrdersApi,
    PurchaseOrderWriteOptions,
    PurchaseOrder,
} from '@/core/types/purchase-order'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { PurchaseOrderRepository } from '@/api/mocks/persistence/purchase-order-repository'
import type { PurchaseOrderMutation } from '@/api/mocks/persistence/purchase-order-mutation'
import { requirePurchaseOrderPermission } from '@/api/mocks/purchase-order-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockPurchaseOrders(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new PurchaseOrderRepository(),
): PurchaseOrdersApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<PurchaseOrderMutation, 'key' | 'hash'>,
        options: PurchaseOrderWriteOptions,
    ): Promise<PurchaseOrder> {
        const actor = requirePurchaseOrderPermission(getUser(), mutation.action)
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
                    'lines.0.quantity': ['purchase-orders.invalid'],
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
        submit: (id, input, options) => mutate({ action: 'submit', id, input }, options),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
