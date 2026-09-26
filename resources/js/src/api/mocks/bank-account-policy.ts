import type { SessionUser } from '@/core/types/session'
import type { BankAccount } from '@/core/types/bank-account'
import { ApiError } from '@/core/types/api-error'

export function requireBankAccountPermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'lookup',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    const scopes = action === 'lookup' ? ['all', 'own'] : ['all']
    if (!scopes.some((scope) => user.permissions.includes(`bank-accounts.${action}.${scope}`)))
        throw new ApiError('forbidden')
    return user
}
export function presentBankAccount(bankAccount: BankAccount, user: SessionUser): BankAccount {
    return {
        ...bankAccount,
        allowedActions: user.permissions.includes('bank-accounts.update.all') ? ['update'] : [],
    }
}
