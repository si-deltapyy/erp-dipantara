import type { Buyer, BuyerInput, BuyerQuery, BuyerUpdate } from '@/core/types/buyer'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseBuyerInput, parseBuyerQuery } from '@/api/buyer-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { requireBuyerPermission, presentBuyer } from '../buyer-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeBuyer } from './buyer-mutation'

export class BuyerRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: BuyerQuery,
        signal: AbortSignal,
        lookup = false,
    ): Promise<PageResponse<Buyer>> {
        const actor = requireBuyerPermission(user, lookup ? 'lookup' : 'read')
        const filter = parseBuyerQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'buyers'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('buyers'))
                    .filter((buyer) =>
                        (lookup
                            ? [buyer.companyName]
                            : [buyer.companyName, buyer.contactName, buyer.phone, buyer.address]
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
                        .map((buyer) => ({
                            ...presentBuyer(buyer, actor),
                            snapshotGeneration: metadata.generation,
                        })),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Buyer> {
        const actor = requireBuyerPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'buyers'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const buyer = await transaction.get('buyers', id)
                if (!buyer) throw new ApiError('not-found')
                return { ...presentBuyer(buyer, actor), snapshotGeneration: metadata.generation }
            },
            signal,
        )
    }
    async save(
        user: SessionUser | null,
        input: BuyerInput | BuyerUpdate,
        key: string,
        generation: string,
        signal: AbortSignal,
        id?: string,
    ): Promise<Buyer> {
        const actor = requireBuyerPermission(user, id ? 'update' : 'create')
        const parsed = parseBuyerInput(input, !!id)
        if (id) parseId(id)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const payloadHash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'buyers', 'buyerMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const buyer = await writeBuyer(transaction, metadata, actor, {
                    id,
                    input: parsed,
                    idempotencyKey: key,
                    payloadHash,
                })
                return presentBuyer(buyer, actor)
            },
            signal,
        )
    }
}
