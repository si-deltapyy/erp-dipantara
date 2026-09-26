import { expect, test } from 'vitest'
import {
    parseBankAccountInput,
    parseBankAccount,
    parseBankAccountQuery,
    parseBankAccountListQuery,
} from './bank-account-mapper'
import { bankAccountFixtures } from './mocks/bank-account-fixtures'
import {
    emptyBankAccount,
    validateBankAccount,
    bankAccountLookupLabel,
} from '@/core/domain/bank-account-validation'

const input = {
    bankName: ' Demo Bank ',
    accountNumber: ' 0000123 ',
    accountHolder: ' Demo Owner ',
    ownerType: 'company',
    ownerId: null,
}
test('normalizes text while preserving account identifiers and ownership', () => {
    expect(parseBankAccountInput(input)).toEqual({
        ...input,
        bankName: 'Demo Bank',
        accountNumber: '0000123',
        accountHolder: 'Demo Owner',
    })
    expect(
        parseBankAccountInput({ ...input, ownerType: 'buyer', ownerId: 'buyer-1' }),
    ).toMatchObject({ ownerType: 'buyer', ownerId: 'buyer-1' })
    expect(
        parseBankAccountInput(
            { ...input, ownerType: 'mitra', ownerId: 'mitra-1', version: 2 },
            true,
        ),
    ).toMatchObject({ version: 2 })
    expect(Object.keys(validateBankAccount(emptyBankAccount()))).toEqual([
        'bankName',
        'accountNumber',
        'accountHolder',
    ])
})
test.each([
    { accountNumber: 123 },
    { accountNumber: ' ' },
    { accountNumber: '0'.repeat(51) },
    { bankName: 'x'.repeat(256) },
    { accountHolder: '' },
    { ownerType: 'other' },
    { ownerId: 'company-id' },
    { ownerType: 'buyer', ownerId: null },
    { ownerType: 'mitra', ownerId: ' ' },
    { extra: true },
])('rejects malformed bank account input %#', (patch) => {
    expect(() => parseBankAccountInput({ ...input, ...patch })).toThrow()
})
test('requires version on update and excludes local persistence metadata from wire responses', () => {
    expect(() => parseBankAccountInput(input, true)).toThrow()
    expect(() => parseBankAccountInput({ ...input, version: 0 }, true)).toThrow()
    const account = bankAccountFixtures[0]
    expect(parseBankAccount(account)).toEqual(account)
    expect(() => parseBankAccount({ ...account, snapshotGeneration: 'local' })).toThrow()
    if (!account) throw new Error('Missing fixture')
    expect(bankAccountLookupLabel(account)).not.toContain(account.accountNumber)
    expect(bankAccountLookupLabel(account)).toContain(account.accountNumber.slice(-4))
})
test('preserves invoice filters and validates lookup pagination', () => {
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: 'createdAt' as const,
        ownerType: 'buyer' as const,
        ownerId: 'buyer-1',
        invoiceId: 'invoice-1',
    }
    expect(parseBankAccountQuery(query)).toEqual(query)
    expect(() => parseBankAccountListQuery(query)).toThrow()
    expect(() => parseBankAccountQuery({ ...query, perPage: 101 })).toThrow()
    expect(() => parseBankAccountQuery({ ...query, invoiceId: '' })).toThrow()
})
