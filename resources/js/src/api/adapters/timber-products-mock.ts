import { simulateTimberVolume } from '@/api/mocks/timber-volume'
import type {
    TimberProduct,
    TimberProductInput,
    TimberProductUpdate,
    TimberProductWriteOptions,
    TimberProductsApi,
} from '@/core/types/timber-product'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { TimberProductRepository } from '@/api/mocks/persistence/timber-product-repository'
import { requireTimberProductPermission } from '@/api/mocks/timber-product-policy'
import { ApiError } from '@/core/types/api-error'

export function createMockTimberProducts(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new TimberProductRepository(),
): TimberProductsApi {
    const generations = new Map<string, string>()
    function mutationGeneration(key: string, generation: string, expected?: string): string {
        const identity = `${getUser()?.id}:${key}`
        const snapshot = generations.get(identity) ?? expected ?? generation
        generations.set(identity, snapshot)
        return snapshot
    }
    async function save(
        input: TimberProductInput | TimberProductUpdate,
        options: TimberProductWriteOptions,
        id?: string,
    ): Promise<TimberProduct> {
        requireTimberProductPermission(getUser(), id ? 'update' : 'create')
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
        previewVolume: simulateTimberVolume,
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
                            : response.data.map((timberProduct) => ({
                                  id: timberProduct.id,
                                  label: timberProduct.name,
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
        ? new ApiError('validation', { name: ['timber-products.invalid'] })
        : cause
}
