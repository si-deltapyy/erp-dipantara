import { parseTimestamp } from './contracts/timestamp-parser'
import type {
    BankAccount,
    BankAccountRecord,
    BankAccountInput,
    BankAccountUpdate,
    BankAccountOwnerType,
    BankAccountQuery,
} from '@/core/types/bank-account'
import { bankAccountFieldLimits } from '@/core/domain/bank-account-validation'
import { parseMetadata } from './contracts/response-parsers'
import { parseMasterQuery } from './contracts/master-parsers'
import {
    invalidContract,
    parseId,
    parseNumericId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'

const inputFields = [...Object.keys(bankAccountFieldLimits), 'ownerType', 'ownerId']
export function parseBankAccountOwnerType(value: unknown): BankAccountOwnerType {
    if (value === 'company' || value === 'buyer' || value === 'mitra') return value
    return invalidContract('ownerType')
}
function parseFields(record: Record<string, unknown>): BankAccountInput {
    const field = (name: keyof typeof bankAccountFieldLimits): string => {
        const value = parseString(record[name], name).trim()
        if (!value || [...value].length > bankAccountFieldLimits[name]) return invalidContract(name)
        return value
    }
    const ownerType = parseBankAccountOwnerType(record.ownerType)
    const ownerId = record.ownerId === null ? null : parseId(record.ownerId, 'ownerId')
    if (ownerType === 'company' ? ownerId !== null : !ownerId?.trim())
        return invalidContract('ownerId')
    return {
        bankName: field('bankName'),
        accountNumber: field('accountNumber'),
        accountHolder: field('accountHolder'),
        ownerType,
        ownerId,
    }
}
export function parseBankAccountInput(
    value: unknown,
    update = false,
): BankAccountInput | BankAccountUpdate {
    const record = parseObject(value, 'bankAccount')
    requireKeys(record, [...inputFields, ...(update ? ['version'] : [])], 'bankAccount')
    const input = parseFields(record)
    return update ? { ...input, version: parseInteger(record.version, 'version') } : input
}
export function parseBankAccount(value: unknown): BankAccount {
    const record = parseObject(value, 'bankAccount')
    requireKeys(
        record,
        [
            ...inputFields,
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'bankAccount',
    )
    return {
        ...parseFields(record),
        ...parseMetadata(record),
        id: parseId(record.id),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseBankAccountQuery(query: BankAccountQuery): BankAccountQuery {
    requireKeys(
        parseObject(query, 'query'),
        ['page', 'perPage', 'search', 'sort', 'ownerType', 'ownerId', 'invoiceId'],
        'query',
    )
    return {
        ...parseMasterQuery(query),
        ...(query.ownerType === undefined
            ? {}
            : { ownerType: parseBankAccountOwnerType(query.ownerType) }),
        ...(query.ownerId === undefined ? {} : { ownerId: parseId(query.ownerId, 'ownerId') }),
        ...(query.invoiceId === undefined
            ? {}
            : { invoiceId: parseId(query.invoiceId, 'invoiceId') }),
    }
}
export { parseMasterLookup as parseBankAccountLookup } from './contracts/master-parsers'

export function parseBankAccountListQuery(query: BankAccountQuery): BankAccountQuery {
    requireKeys(parseObject(query, 'query'), ['page', 'perPage', 'search', 'sort'], 'query')
    return parseMasterQuery(query)
}

export function parseBankAccountRecord(
    value: unknown,
    source: BankAccountRecord['source'],
): BankAccountRecord {
    const account = parseObject(value, 'account')
    return {
        id: parseNumericId(account.id),
        source,
        bankName: parseString(account.bank_name, 'bank_name'),
        accountNumber: parseString(account.account_number, 'account_number'),
        accountHolder: parseString(account.account_holder_name, 'account_holder_name'),
        ...(source === 'rekenings'
            ? { mitraId: parseNumericId(account.mitra_id, 'mitra_id') }
            : {}),
        createdAt: parseTimestamp(account.created_at, 'created_at'),
        updatedAt: parseTimestamp(account.updated_at, 'updated_at'),
    }
}
