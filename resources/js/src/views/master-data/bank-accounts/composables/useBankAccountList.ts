import { inject } from 'vue'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import { useMasterList } from '@/composables/useMasterList'
import type { BankAccountRecord } from '@/core/types/bank-account'

export function useBankAccountList(): ReturnType<typeof useMasterList<BankAccountRecord>> & {
    searchBankAccounts(): Promise<void>
} {
    const api = inject(bankAccountsApiKey)
    if (!api) throw new Error('Bank accounts API is not configured')
    const list = useMasterList(api, 'bank-accounts', undefined, {
        searchText: (account) =>
            [account.bankName, account.accountNumber, account.accountHolder].join(' '),
        compare: (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    })
    return { ...list, searchBankAccounts: list.searchRecords }
}
