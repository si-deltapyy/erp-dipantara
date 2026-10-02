import type { AxiosInstance } from 'axios'
import type { BankAccountsApi } from '@/core/types/bank-account'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection } from '@/api/contracts/response-parsers'
import { parseBankAccountRecord } from '@/api/bank-account-mapper'

export function createHttpBankAccounts(
    client: AxiosInstance = createHttpClient(),
): BankAccountsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const accounts = await client.get<unknown>('/api/v1/bank-account-numbers', { signal })
            const linkedAccounts = await client.get<unknown>('/api/v1/rekenings', { signal })
            return [
                ...parseCollection(accounts.data, (account) =>
                    parseBankAccountRecord(account, 'bank-account-numbers'),
                ),
                ...parseCollection(linkedAccounts.data, (account) =>
                    parseBankAccountRecord(account, 'rekenings'),
                ),
            ]
        },
        lookup: unavailable,
        get: unavailable,
        create: unavailable,
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
