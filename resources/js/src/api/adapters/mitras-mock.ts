import type {
    Mitra,
    MitraInput,
    MitraUpdate,
    MitraWriteOptions,
    MitrasApi,
} from '@/core/types/mitra'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { MitraRepository } from '@/api/mocks/persistence/mitra-repository'
import { requireMitraPermission } from '@/api/mocks/mitra-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockMitras(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new MitraRepository(),
): MitrasApi {
    const generations = new Map<string, string>()
    function mutationGeneration(key: string, generation: string, expected?: string): string {
        const identity = `${getUser()?.id}:${key}`
        const snapshot = generations.get(identity) ?? expected ?? generation
        generations.set(identity, snapshot)
        return snapshot
    }
    async function save(
        input: MitraInput | MitraUpdate,
        options: MitraWriteOptions,
        id?: string,
    ): Promise<Mitra> {
        requireMitraPermission(getUser(), id ? 'update' : 'create')
        try {
            return await runtime.executeBusiness('update', options.signal, (active, generation) =>
                repository.save(
                    getUser(),
                    input,
                    options.idempotencyKey,
                    mutationGeneration(
                        options.idempotencyKey,
                        generation,
                        options.snapshotGeneration,
                    ),
                    active,
                    id,
                ),
            )
        } catch (cause) {
            throw mapValidation(cause)
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
        lookup: (query, signal) =>
            runtime.executeBusiness('read', signal, async (active, _generation, scenario) => {
                const response = await repository.list(getUser(), query, active, true)
                return {
                    data:
                        scenario === 'empty'
                            ? []
                            : response.data.map((mitra) => ({
                                  id: mitra.id,
                                  label: mitra.name,
                              })),
                    meta: {
                        ...response.meta,
                        total: scenario === 'empty' ? 0 : response.meta.total,
                    },
                }
            }),
        get: (id, signal) =>
            runtime.executeBusiness('read', signal, (active) =>
                repository.get(getUser(), id, active),
            ),
        create: (input, options) => save(input, options),
        update: (id, input, options) => save(input, options, id),
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
function mapValidation(cause: unknown): unknown {
    return cause instanceof ApiError &&
        cause.kind === 'validation' &&
        'quantity' in cause.fieldErrors
        ? new ApiError('validation', { name: ['mitras.invalid'] })
        : cause
}
