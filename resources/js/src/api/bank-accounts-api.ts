import type { InjectionKey } from 'vue'
import type { BankAccountsApi } from '@/core/types/bank-account'

export const bankAccountsApiKey: InjectionKey<BankAccountsApi> = Symbol('bank-accounts-api')
