import type {
    Grader,
    GraderProvisionInput,
    GraderInput,
    GraderQuery,
    GraderUpdate,
} from '@/core/types/grader'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseGraderInput, parseGraderQuery, parseGraderProvision } from '@/api/grader-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { requireGraderPermission, presentGrader } from '../grader-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeGrader } from './grader-mutation'
import { provisionGrader } from './grader-provision'

export class GraderRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: GraderQuery,
        signal: AbortSignal,
        lookup = false,
    ): Promise<PageResponse<Grader>> {
        const actor = requireGraderPermission(user, lookup ? 'lookup' : 'read')
        const filter = parseGraderQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'graders'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('graders'))
                    .filter((grader) =>
                        (lookup
                            ? [grader.name]
                            : [grader.name, grader.email, grader.phone, grader.address]
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
                        .map((grader) => ({
                            ...presentGrader(grader, actor),
                            snapshotGeneration: metadata.generation,
                        })),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Grader> {
        const actor = requireGraderPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'graders'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const grader = await transaction.get('graders', id)
                if (!grader) throw new ApiError('not-found')
                return { ...presentGrader(grader, actor), snapshotGeneration: metadata.generation }
            },
            signal,
        )
    }
    async save(
        user: SessionUser | null,
        input: GraderInput | GraderUpdate,
        key: string,
        generation: string,
        signal: AbortSignal,
        id?: string,
    ): Promise<Grader> {
        const actor = requireGraderPermission(user, id ? 'update' : 'create')
        const parsed = parseGraderInput(input, !!id)
        if (id) parseId(id)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const payloadHash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'graders', 'graderMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const grader = await writeGrader(transaction, metadata, actor, {
                    id,
                    input: parsed,
                    idempotencyKey: key,
                    payloadHash,
                })
                return presentGrader(grader, actor)
            },
            signal,
        )
    }
    async provision(
        user: SessionUser | null,
        id: string,
        input: GraderProvisionInput,
        key: string,
        generation: string,
        signal: AbortSignal,
    ): Promise<Grader> {
        const actor = requireGraderPermission(user, 'provision')
        parseId(id)
        const parsed = parseGraderProvision(input)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const hash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'graders', 'graderMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentGrader(
                    await provisionGrader(transaction, metadata, actor, id, parsed, key, hash),
                    actor,
                )
            },
            signal,
        )
    }
}
