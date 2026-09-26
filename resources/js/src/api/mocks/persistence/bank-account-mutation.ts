import { validateBankAccountOwner } from './bank-account-owner'
import type { BankAccount, BankAccountInput, BankAccountUpdate } from '@/core/types/bank-account'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseBankAccount } from '@/api/bank-account-mapper'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'

export interface BankAccountMutation {
    readonly id?: string
    readonly input: BankAccountInput | BankAccountUpdate
    readonly idempotencyKey: string
    readonly payloadHash: string
}
export async function writeBankAccount(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: BankAccountMutation,
): Promise<BankAccount> {
    const receiptId = JSON.stringify([
        actor.id,
        mutation.id ? 'PUT' : 'POST',
        `/bank-accounts/${mutation.id ?? ''}`,
        mutation.idempotencyKey,
    ])
    const receipt = await transaction.get('bankAccountMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.payloadHash) throw new ApiError('conflict')
        return parseBankAccount(receipt.result)
    }
    const previous = mutation.id ? await transaction.get('bank-accounts', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    await validateBankAccountOwner(transaction, mutation.input, previous)
    const bankAccount = makeBankAccount(mutation, actor.id, previous)
    await transaction.put('bank-accounts', bankAccount)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'bank-accounts',
        recordId: bankAccount.id,
        actorId: actor.id,
        version: bankAccount.version,
    })
    await transaction.put('bankAccountMutations', {
        id: receiptId,
        payloadHash: mutation.payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result: bankAccount,
    })
    return bankAccount
}
function makeBankAccount(
    mutation: BankAccountMutation,
    actorId: string,
    previous?: BankAccount,
): BankAccount {
    const timestamp = new Date().toISOString()
    return parseBankAccount({
        ...mutation.input,
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
        createdByUserId: previous?.createdByUserId ?? actorId,
        submittedByUserId: null,
        allowedActions: [],
    })
}
