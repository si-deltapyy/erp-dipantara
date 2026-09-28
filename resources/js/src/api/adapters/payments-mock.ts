import type { PaymentsApi, Payment } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import type { PaymentMutation } from '@/api/mocks/persistence/payment-mutation'
import { PaymentRepository } from '@/api/mocks/persistence/payment-repository'
import { requirePaymentPermission } from '@/api/mocks/persistence/payment-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockPayments(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new PaymentRepository(),
): PaymentsApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<PaymentMutation, 'key' | 'hash'>,
        options: WorkflowWriteOptions,
    ): Promise<Payment> {
        const actor = requirePaymentPermission(getUser(), mutation.action)
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
        create: (input, options) => mutate({ action: 'create', input }, options),
        update: (id, input, options) => mutate({ action: 'update', id, input }, options),
        submit: (id, input, options) => mutate({ action: 'submit', id, input }, options),
        approve: (id, input, options) => mutate({ action: 'approve', id, input }, options),
        reject: (id, input, options) => mutate({ action: 'reject', id, input }, options),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
