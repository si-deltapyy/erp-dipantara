import type {
    TimberProduct,
    TimberProductInput,
    TimberProductQuery,
    TimberProductUpdate,
} from '@/core/types/timber-product'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseTimberProductInput, parseTimberProductQuery } from '@/api/timber-product-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { requireTimberProductPermission, presentTimberProduct } from '../timber-product-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeTimberProduct } from './timber-product-mutation'
import {
    canLookupTimberProduct,
    timberProductTransactionFixtures,
} from '../timber-product-lookup-scope'
import type { TimberProductTransactionLink } from '../timber-product-lookup-scope'

export class TimberProductRepository {
    constructor(
        private readonly options: DatabaseOptions = {},
        private readonly transactionLinks: () => readonly TimberProductTransactionLink[] = () =>
            timberProductTransactionFixtures,
    ) {}
    async list(
        user: SessionUser | null,
        query: TimberProductQuery,
        signal: AbortSignal,
        lookup = false,
    ): Promise<PageResponse<TimberProduct>> {
        const actor = requireTimberProductPermission(user, lookup ? 'lookup' : 'read')
        const filter = parseTimberProductQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'timber-products'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('timber-products'))
                    .filter(
                        (timberProduct) =>
                            !lookup ||
                            canLookupTimberProduct(
                                timberProduct.id,
                                actor,
                                this.transactionLinks(),
                            ),
                    )
                    .filter((timberProduct) =>
                        (lookup
                            ? [timberProduct.name]
                            : [
                                  timberProduct.name,
                                  timberProduct.gradeCode,
                                  timberProduct.diameterCm,
                                  timberProduct.lengthM,
                              ]
                        ).some((field) => field.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort((left, right) => {
                        const order =
                            left.createdAt.localeCompare(right.createdAt) ||
                            left.id.localeCompare(right.id)
                        return filter.sort === 'createdAt' ? order : -order
                    })
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((timberProduct) => ({
                            ...presentTimberProduct(timberProduct, actor),
                            snapshotGeneration: metadata.generation,
                        })),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<TimberProduct> {
        const actor = requireTimberProductPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'timber-products'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const timberProduct = await transaction.get('timber-products', id)
                if (!timberProduct) throw new ApiError('not-found')
                return {
                    ...presentTimberProduct(timberProduct, actor),
                    snapshotGeneration: metadata.generation,
                }
            },
            signal,
        )
    }
    async save(
        user: SessionUser | null,
        input: TimberProductInput | TimberProductUpdate,
        key: string,
        generation: string,
        signal: AbortSignal,
        id?: string,
    ): Promise<TimberProduct> {
        const actor = requireTimberProductPermission(user, id ? 'update' : 'create')
        const parsed = parseTimberProductInput(input, !!id)
        if (id) parseId(id)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const payloadHash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'timber-products', 'timberProductMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const timberProduct = await writeTimberProduct(transaction, metadata, actor, {
                    id,
                    input: parsed,
                    idempotencyKey: key,
                    payloadHash,
                })
                return presentTimberProduct(timberProduct, actor)
            },
            signal,
        )
    }
}
