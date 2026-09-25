import type { Mitra, MitraInput, MitraQuery, MitraUpdate } from '@/core/types/mitra'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseMitraInput, parseMitraQuery } from '@/api/mitra-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { requireMitraPermission, presentMitra } from '../mitra-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeMitra } from './mitra-mutation'
import { canLookupMitra, mitraTransactionFixtures } from '../mitra-lookup-scope'
import type { MitraTransactionLink } from '../mitra-lookup-scope'

export class MitraRepository {
    constructor(
        private readonly options: DatabaseOptions = {},
        private readonly transactionLinks: () => readonly MitraTransactionLink[] = () =>
            mitraTransactionFixtures,
    ) {}
    async list(
        user: SessionUser | null,
        query: MitraQuery,
        signal: AbortSignal,
        lookup = false,
    ): Promise<PageResponse<Mitra>> {
        const actor = requireMitraPermission(user, lookup ? 'lookup' : 'read')
        const filter = parseMitraQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'mitras'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('mitras'))
                    .filter(
                        (mitra) =>
                            !lookup || canLookupMitra(mitra.id, actor, this.transactionLinks()),
                    )
                    .filter((mitra) =>
                        (lookup ? [mitra.name] : [mitra.name, mitra.phone, mitra.address]).some(
                            (field) => field.toLocaleLowerCase('id').includes(search),
                        ),
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
                        .map((mitra) => ({
                            ...presentMitra(mitra, actor),
                            snapshotGeneration: metadata.generation,
                        })),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Mitra> {
        const actor = requireMitraPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'mitras'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const mitra = await transaction.get('mitras', id)
                if (!mitra) throw new ApiError('not-found')
                return { ...presentMitra(mitra, actor), snapshotGeneration: metadata.generation }
            },
            signal,
        )
    }
    async save(
        user: SessionUser | null,
        input: MitraInput | MitraUpdate,
        key: string,
        generation: string,
        signal: AbortSignal,
        id?: string,
    ): Promise<Mitra> {
        const actor = requireMitraPermission(user, id ? 'update' : 'create')
        const parsed = parseMitraInput(input, !!id)
        if (id) parseId(id)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const payloadHash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'mitras', 'mitraMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const mitra = await writeMitra(transaction, metadata, actor, {
                    id,
                    input: parsed,
                    idempotencyKey: key,
                    payloadHash,
                })
                return presentMitra(mitra, actor)
            },
            signal,
        )
    }
}
