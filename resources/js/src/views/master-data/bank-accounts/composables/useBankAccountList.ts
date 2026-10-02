import { inject } from 'vue'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import { useMasterList } from '@/composables/useMasterList'
import type { BankAccount } from '@/core/types/bank-account'

export function useBankAccountList(): ReturnType<typeof useMasterList<BankAccount>> & {
    searchBankAccounts(): Promise<void>
} {
    const api = inject(bankAccountsApiKey)
    if (!api) throw new Error('BankAccounts API is not configured')
    const list = useMasterList(api, 'bank-accounts')
    return { ...list, searchBankAccounts: list.searchRecords }
}
