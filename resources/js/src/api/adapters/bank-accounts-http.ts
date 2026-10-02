import type { AxiosInstance } from 'axios'
import type { BankAccountsApi, BankAccountWriteOptions } from '@/core/types/bank-account'
import { createHttpClient } from '@/services/http-client'
import { parseDetail, parsePage } from '@/api/contracts/response-parsers'
import {
    parseBankAccount,
    parseBankAccountInput,
    parseBankAccountLookup,
    parseBankAccountQuery,
    parseBankAccountListQuery,
} from '@/api/bank-account-mapper'
import { parseId } from '@/api/contracts/value-parsers'

const endpoint = '/api/v1/bank-accounts'
export function createHttpBankAccounts(
    client: AxiosInstance = createHttpClient(),
): BankAccountsApi {
    const writeConfig = (options: BankAccountWriteOptions) => ({
        signal: options.signal,
        headers: { 'Idempotency-Key': options.idempotencyKey },
    })
    return {
        async list(query, signal) {
            const response = await client.get<unknown>(endpoint, {
                params: parseBankAccountListQuery(query),
                signal,
            })
            return parsePage(response.data, parseBankAccount)
        },
        async lookup(query, signal) {
            const response = await client.get<unknown>(`${endpoint}/lookup`, {
                params: parseBankAccountQuery(query),
                signal,
            })
            return parsePage(response.data, parseBankAccountLookup)
        },
        async get(id, signal) {
            const response = await client.get<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                { signal },
            )
            return parseDetail(response.data, parseBankAccount).data
        },
        async create(input, options) {
            const response = await client.post<unknown>(
                endpoint,
                parseBankAccountInput(input),
                writeConfig(options),
            )
            return parseDetail(response.data, parseBankAccount).data
        },
        async update(id, input, options) {
            const response = await client.put<unknown>(
                `${endpoint}/${encodeURIComponent(parseId(id))}`,
                parseBankAccountInput(input, true),
                writeConfig(options),
            )
            return parseDetail(response.data, parseBankAccount).data
        },
        subscribe: () => () => undefined,
    }
}
