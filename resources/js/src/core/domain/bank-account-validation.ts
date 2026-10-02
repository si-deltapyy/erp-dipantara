import type { BankAccountInput } from '@/core/types/bank-account'

export const bankAccountFieldLimits = { bankName: 255, accountNumber: 50, accountHolder: 255 }
export type BankAccountField = keyof BankAccountInput
export type BankAccountErrors = Partial<Record<BankAccountField, string>>
export function validateBankAccount(input: BankAccountInput): BankAccountErrors {
    const errors: BankAccountErrors = {}
    for (const field of Object.keys(
        bankAccountFieldLimits,
    ) as (keyof typeof bankAccountFieldLimits)[]) {
        if (!input[field].trim()) errors[field] = 'bank-accounts.required'
        else if ([...input[field].trim()].length > bankAccountFieldLimits[field])
            errors[field] = 'bank-accounts.tooLong'
    }
    if (!['company', 'buyer', 'mitra'].includes(input.ownerType))
        errors.ownerType = 'bank-accounts.invalid'
    if (input.ownerType === 'company' ? input.ownerId !== null : !input.ownerId?.trim())
        errors.ownerId = 'bank-accounts.required'
    return errors
}
export function emptyBankAccount(): BankAccountInput {
    return {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        ownerType: 'company',
        ownerId: null,
    }
}
export function bankAccountDraft(input: BankAccountInput): BankAccountInput {
    return {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountHolder: input.accountHolder,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
    }
}
export function bankAccountLookupLabel(account: BankAccountInput): string {
    return `${account.bankName} · ${account.accountHolder} · ••••${account.accountNumber.slice(-4)}`
}
