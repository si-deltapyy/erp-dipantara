import { ApiError } from '@/core/types/api-error'
import type { SessionUser } from '@/core/types/session'
import {
    assertRecordAccess,
    evaluateRecordAccess,
    hasBusinessPermission,
} from '@/core/domain/record-policy'
import { parseInteger } from '@/api/contracts/value-parsers'
import type { DatabaseOptions } from './database'
import { demoDatasetVersion, demoStores } from './schema'
import type { DatasetMetadata, DemoSample } from './schema'
import { runDemoTransaction } from './transaction'
import type { DemoTransaction } from './transaction'
import { seedDataset } from './seed'
import { DemoStorageError } from './storage-error'
import { executeIdempotentMutation, hashMutationPayload } from './idempotency'

export interface DemoSnapshot {
    readonly metadata: DatasetMetadata
    readonly samples: readonly DemoSample[]
}
export interface SampleMutation {
    readonly id: string
    readonly version: number
    readonly generation: string
    readonly quantity: number
    readonly idempotencyKey: string
}
export async function requireDataset(transaction: DemoTransaction): Promise<DatasetMetadata> {
    const metadata = await transaction.get('metadata', 'dataset')
    if (!metadata || metadata.datasetVersion !== demoDatasetVersion)
        throw new DemoStorageError('incompatible')
    if (
        !Number.isSafeInteger(metadata.revision) ||
        metadata.revision < 1 ||
        typeof metadata.generation !== 'string'
    )
        throw new DemoStorageError('incompatible')
    return metadata
}
export class DemoRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    initialize(signal?: AbortSignal): Promise<DatasetMetadata> {
        return runDemoTransaction(
            this.options,
            demoStores,
            'readwrite',
            async (transaction) => {
                const metadata = await transaction.get('metadata', 'dataset')
                if (!metadata) {
                    for (const store of demoStores)
                        if (await transaction.count(store))
                            throw new DemoStorageError('incompatible')
                    return seedDataset(transaction, 1)
                }
                return requireDataset(transaction)
            },
            signal,
        )
    }
    read(user: SessionUser | null, signal?: AbortSignal): Promise<DemoSnapshot> {
        if (!user) return Promise.reject(new ApiError('unauthenticated'))
        return runDemoTransaction(
            this.options,
            ['metadata', 'samples'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const samples = hasBusinessPermission(user, 'gradings.read')
                    ? (await transaction.list('samples')).filter(
                          (sample) =>
                              evaluateRecordAccess(user, 'gradings.read', sample) === 'allowed',
                      )
                    : []
                return { metadata, samples }
            },
            signal,
        )
    }
    async update(
        user: SessionUser | null,
        input: SampleMutation,
        signal?: AbortSignal,
    ): Promise<DemoSample> {
        if (!user) throw new ApiError('unauthenticated')
        parseInteger(input.quantity, 'quantity', 0, 1_000_000)
        parseInteger(input.version, 'version')
        const payloadHash = await hashMutationPayload({
            id: input.id,
            version: input.version,
            generation: input.generation,
            quantity: input.quantity,
        })
        return runDemoTransaction(
            this.options,
            ['metadata', 'samples', 'audit', 'mutations'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== input.generation) throw new ApiError('conflict')
                if (!hasBusinessPermission(user, 'gradings.update')) throw new ApiError('forbidden')
                const sample = await transaction.get('samples', input.id)
                if (!sample) throw new ApiError('not-found')
                assertRecordAccess(user, 'gradings.update', sample)
                return executeIdempotentMutation(
                    transaction,
                    {
                        actorId: user.id,
                        method: 'PUT',
                        path: `/demo/samples/${input.id}`,
                        key: input.idempotencyKey,
                        payloadHash,
                    },
                    () => this.writeSample(transaction, metadata, sample, input, user.id),
                )
            },
            signal,
        )
    }
    private async writeSample(
        transaction: DemoTransaction,
        metadata: DatasetMetadata,
        sample: DemoSample,
        input: SampleMutation,
        actorId: string,
    ): Promise<DemoSample> {
        if (sample.version !== input.version) throw new ApiError('conflict')
        const updated = { ...sample, quantity: input.quantity, version: sample.version + 1 }
        await transaction.put('samples', updated)
        await transaction.put('audit', {
            id: crypto.randomUUID(),
            sampleId: sample.id,
            actorId,
            version: updated.version,
        })
        await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
        return updated
    }
    reset(signal?: AbortSignal): Promise<DatasetMetadata> {
        return runDemoTransaction(
            this.options,
            demoStores,
            'readwrite',
            async (transaction) => {
                const metadata = await transaction.get('metadata', 'dataset')
                const revision = Number.isSafeInteger(metadata?.revision)
                    ? (metadata?.revision ?? 0) + 1
                    : 1
                return seedDataset(transaction, revision)
            },
            signal,
        )
    }
}
