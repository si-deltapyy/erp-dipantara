import type { BankAccountInput } from '@/core/types/bank-account'
import { ApiError } from '@/core/types/api-error'
import type { DemoTransaction } from './transaction'

export async function validateBankAccountOwner(
    transaction: DemoTransaction,
    input: BankAccountInput,
    previous?: BankAccountInput,
): Promise<void> {
    if (previous && (previous.ownerType !== input.ownerType || previous.ownerId !== input.ownerId))
        throw new ApiError('validation', {
            ownerType: ['bank-accounts.ownerImmutable'],
            ownerId: ['bank-accounts.ownerImmutable'],
        })
    if (input.ownerType === 'company') return
    const owner =
        input.ownerId &&
        (await transaction.get(input.ownerType === 'buyer' ? 'buyers' : 'mitras', input.ownerId))
    if (!owner) throw new ApiError('validation', { ownerId: ['bank-accounts.ownerMissing'] })
}
