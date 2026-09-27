import { expect, test } from 'vitest'
import { mitraFixtures } from './mocks/mitra-fixtures'
import { parseMitra, parseMitraInput, parseMitraLookup, parseMitraQuery } from './mitra-mapper'
import { validateMitra } from '@/core/domain/mitra-validation'

const input = {
    name: 'Synthetic Company',
    phone: '00123',
    address: '',
}
test('preserves phone strings and validates required fields and limits', () => {
    expect(parseMitraInput(input)).toEqual(input)
    expect(validateMitra({ ...input, name: ' ', phone: '0'.repeat(41) })).toEqual({
        name: 'mitras.required',
        phone: 'mitras.tooLong',
    })
    expect(() => parseMitraInput({ ...input, role: 'admin' })).toThrow()
    expect(() => parseMitraInput({ ...input, name: ' ' })).toThrow()
    expect(() => parseMitraInput({ ...input, version: 0 }, true)).toThrow()
})
test('rejects malformed responses and contact leakage in lookup', () => {
    expect(parseMitra(mitraFixtures[0])).toEqual(mitraFixtures[0])
    expect(() => parseMitra({ ...mitraFixtures[0], updatedAt: 'yesterday' })).toThrow()
    expect(() => parseMitraLookup({ id: 'mitra', label: 'Demo', phone: '123' })).toThrow()
    expect(parseMitraLookup({ id: 'mitra', label: 'Demo' })).toEqual({ id: 'mitra', label: 'Demo' })
})
test('enforces list query bounds', () => {
    const query = { page: 1, perPage: 20, search: '', sort: '-createdAt' as const }
    expect(parseMitraQuery(query)).toEqual(query)
    expect(() => parseMitraQuery({ ...query, perPage: 101 })).toThrow()
    expect(() => parseMitraQuery({ ...query, page: 1.5 })).toThrow()
    expect(() => parseMitraQuery({ ...query, search: 'x'.repeat(201) })).toThrow()
})
