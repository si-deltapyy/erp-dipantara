import type {
    BankAccount,
    BankAccountInput,
    BankAccountQuery,
    BankAccountUpdate,
} from '@/core/types/bank-account'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import {
    parseBankAccountInput,
    parseBankAccountQuery,
    parseBankAccountListQuery,
} from '@/api/bank-account-mapper'
import { parseId } from '@/api/contracts/value-parsers'
import { requireBankAccountPermission, presentBankAccount } from '../bank-account-policy'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import type { DatabaseOptions } from './database'
import { hashMutationPayload } from './idempotency'
import { writeBankAccount } from './bank-account-mutation'
import { invoiceAccountLinks } from './bank-account-invoices'
import { resolveBankAccountScope } from '../bank-account-lookup-scope'
import type { BankAccountInvoiceLink } from '../bank-account-lookup-scope'

export class BankAccountRepository {
    constructor(
        private readonly options: DatabaseOptions = {},
        private readonly transactionLinks?: () => readonly BankAccountInvoiceLink[],
    ) {}
    async list(
        user: SessionUser | null,
        query: BankAccountQuery,
        signal: AbortSignal,
        lookup = false,
    ): Promise<PageResponse<BankAccount>> {
        const actor = requireBankAccountPermission(user, lookup ? 'lookup' : 'read')
        const filter = lookup ? parseBankAccountQuery(query) : parseBankAccountListQuery(query)
        return runDemoTransaction(
            this.options,
            ['metadata', 'bank-accounts', 'invoices', 'purchase-orders'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const inScope = lookup
                    ? resolveBankAccountScope(
                          actor,
                          filter,
                          this.transactionLinks?.() ?? (await invoiceAccountLinks(transaction)),
                      )
                    : () => true
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('bank-accounts'))
                    .filter((bankAccount) => inScope(bankAccount))
                    .filter((bankAccount) =>
                        [
                            bankAccount.bankName,
                            bankAccount.accountNumber,
                            bankAccount.accountHolder,
                        ].some((field) => field.toLocaleLowerCase('id').includes(search)),
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
                        .map((bankAccount) => ({
                            ...presentBankAccount(bankAccount, actor),
                            snapshotGeneration: metadata.generation,
                        })),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<BankAccount> {
        const actor = requireBankAccountPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            ['metadata', 'bank-accounts'],
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const bankAccount = await transaction.get('bank-accounts', id)
                if (!bankAccount) throw new ApiError('not-found')
                return {
                    ...presentBankAccount(bankAccount, actor),
                    snapshotGeneration: metadata.generation,
                }
            },
            signal,
        )
    }
    async save(
        user: SessionUser | null,
        input: BankAccountInput | BankAccountUpdate,
        key: string,
        generation: string,
        signal: AbortSignal,
        id?: string,
    ): Promise<BankAccount> {
        const actor = requireBankAccountPermission(user, id ? 'update' : 'create')
        const parsed = parseBankAccountInput(input, !!id)
        if (id) parseId(id)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const payloadHash = await hashMutationPayload({ ...parsed, generation })
        return runDemoTransaction(
            this.options,
            ['metadata', 'bank-accounts', 'bankAccountMutations', 'audit', 'buyers', 'mitras'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                const bankAccount = await writeBankAccount(transaction, metadata, actor, {
                    id,
                    input: parsed,
                    idempotencyKey: key,
                    payloadHash,
                })
                return presentBankAccount(bankAccount, actor)
            },
            signal,
        )
    }
}
