import type { InvoicesApi, Invoice } from '@/core/types/invoice'
import type { SessionUser } from '@/core/types/session'
import type { WorkflowWriteOptions } from '@/core/types/workflow'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import type { InvoiceMutation } from '@/api/mocks/persistence/invoice-mutation'
import { InvoiceRepository } from '@/api/mocks/persistence/invoice-repository'
import { requireInvoicePermission } from '@/api/mocks/persistence/invoice-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockInvoices(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new InvoiceRepository(),
): InvoicesApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<InvoiceMutation, 'key' | 'hash'>,
        options: WorkflowWriteOptions,
    ): Promise<Invoice> {
        const actor = requireInvoicePermission(getUser(), mutation.action)
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
        settlement: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.settlement(getUser(), id, active),
            ),
        versions: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.versions(getUser(), id, active),
            ),
        revise: (id, input, options) => mutate({ action: 'revise', id, input }, options),
        create: (input, options) => mutate({ action: 'create', input }, options),
        update: (id, input, options) => mutate({ action: 'update', id, input }, options),
        issue: (id, input, options) => mutate({ action: 'issue', id, input }, options),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
