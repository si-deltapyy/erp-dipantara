import { defineStore } from 'pinia'
import type { BankAccount, BankAccountInput } from '@/core/types/bank-account'

export interface BankAccountRecovery {
    readonly actorId: string
    readonly bankAccount?: BankAccount
    readonly draft: BankAccountInput
    readonly idempotencyKey: string
}
export const useBankAccountRecoveryStore = defineStore('bankAccount-recovery', {
    state: (): { snapshot: BankAccountRecovery | null } => ({ snapshot: null }),
})
