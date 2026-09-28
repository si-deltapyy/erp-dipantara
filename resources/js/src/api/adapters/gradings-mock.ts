import type { WorkflowWriteOptions } from '@/core/types/workflow'
import { previewGradingVolume } from '@/api/mocks/grading-volume'
import type { GradingsApi, Grading } from '@/core/types/grading'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { GradingRepository } from '@/api/mocks/persistence/grading-repository'
import type { GradingMutation } from '@/api/mocks/persistence/grading-mutation'
import { requireGradingPermission } from '@/api/mocks/grading-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockGradings(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new GradingRepository(),
): GradingsApi {
    const generations = new Map<string, string>()
    async function mutate(
        mutation: Omit<GradingMutation, 'key' | 'hash'>,
        options: WorkflowWriteOptions,
    ): Promise<Grading> {
        const actor = requireGradingPermission(getUser(), mutation.action)
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
                    ['rows']: ['gradings.invalid'],
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
        approve: (id, input, options) => mutate({ action: 'approve', id, input }, options),
        reject: (id, input, options) => mutate({ action: 'reject', id, input }, options),
        revise: (id, input, options) => mutate({ action: 'revise', id, input }, options),
        previewVolume: previewGradingVolume,
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
