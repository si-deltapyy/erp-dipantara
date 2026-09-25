import { expect, test } from 'vitest'
import { buyerFixtures } from './mocks/buyer-fixtures'
import { parseBuyer, parseBuyerInput, parseBuyerLookup, parseBuyerQuery } from './buyer-mapper'
import { validateBuyer } from '@/core/domain/buyer-validation'

const input = {
    companyName: 'Synthetic Company',
    contactName: 'Demo Contact',
    phone: '00123',
    address: '',
}
test('preserves phone strings and validates required fields and limits', () => {
    expect(parseBuyerInput(input)).toEqual(input)
    expect(validateBuyer({ ...input, companyName: ' ', phone: '0'.repeat(41) })).toEqual({
        companyName: 'buyers.required',
        phone: 'buyers.tooLong',
    })
    expect(() => parseBuyerInput({ ...input, role: 'admin' })).toThrow()
    expect(() => parseBuyerInput({ ...input, companyName: ' ' })).toThrow()
    expect(() => parseBuyerInput({ ...input, version: 0 }, true)).toThrow()
})
test('rejects malformed responses and contact leakage in lookup', () => {
    expect(parseBuyer(buyerFixtures[0])).toEqual(buyerFixtures[0])
    expect(() => parseBuyer({ ...buyerFixtures[0], updatedAt: 'yesterday' })).toThrow()
    expect(() => parseBuyerLookup({ id: 'buyer', label: 'Demo', phone: '123' })).toThrow()
    expect(parseBuyerLookup({ id: 'buyer', label: 'Demo' })).toEqual({ id: 'buyer', label: 'Demo' })
})
test('enforces list query bounds', () => {
    const query = { page: 1, perPage: 20, search: '', sort: '-createdAt' as const }
    expect(parseBuyerQuery(query)).toEqual(query)
    expect(() => parseBuyerQuery({ ...query, perPage: 101 })).toThrow()
    expect(() => parseBuyerQuery({ ...query, page: 1.5 })).toThrow()
    expect(() => parseBuyerQuery({ ...query, search: 'x'.repeat(201) })).toThrow()
})
