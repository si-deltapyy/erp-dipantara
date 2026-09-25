import { describe, expect, it } from 'vitest'
import { parseDecimal, parseId, parseMoney, parseString } from './value-parsers'
import { parseDetail, parseErrorEnvelope, parseMetadata, parsePage } from './response-parsers'

describe('contract values', () => {
    it.each(['0', '-12.000001', '12.5'])('accepts decimal %s without numeric coercion', (value) => {
        expect(parseDecimal(value)).toBe(value)
    })
    it.each([12.5, '1e3', 'NaN', '1.1234567', '', ' 1.0'])(
        'rejects invalid decimal %s',
        (value) => {
            expect(() => parseDecimal(value, 'rows.0.volume')).toThrow()
        },
    )
    it.each(['0.00', '-12.50', '1000000000000000000.00'])(
        'preserves money precision %s',
        (value) => {
            expect(parseMoney(value)).toBe(value)
        },
    )
    it.each([0, '1', '1.0', '1.000'])('rejects noncanonical money %s', (value) => {
        expect(() => parseMoney(value)).toThrow()
    })
    it('requires opaque nonempty string IDs with bounded length', () => {
        expect(parseId('001')).toBe('001')
        for (const value of ['', 'x'.repeat(101), 1, null]) expect(() => parseId(value)).toThrow()
    })
})
describe('response boundaries', () => {
    it('parses detail and page envelopes using the domain parser', () => {
        expect(parseDetail({ data: 'label' }, parseString)).toEqual({ data: 'label' })
        expect(
            parsePage({ data: ['label'], meta: { page: 1, perPage: 20, total: 1 } }, parseString)
                .data,
        ).toEqual(['label'])
    })
    it.each([
        { data: [], meta: { page: 0, perPage: 20, total: 0 } },
        { data: [], meta: { page: 1, perPage: 101, total: 0 } },
        { data: [], meta: { page: 1, perPage: 20, total: -1 } },
        { data: {}, meta: { page: 1, perPage: 20, total: 0 } },
        { data: [4], meta: { page: 1, perPage: 20, total: 1 } },
    ])('rejects malformed list envelopes', (value) => {
        expect(() => parsePage(value, parseString)).toThrow()
    })
    it('preserves nested validation paths without introducing a new error class', () => {
        try {
            parsePage({ data: [4], meta: {} }, parseString)
        } catch (error) {
            expect(error).toMatchObject({
                kind: 'validation',
                fieldErrors: { 'data.0': ['contract.invalid'] },
            })
        }
        expect(
            parseErrorEnvelope({
                message: 'Invalid',
                code: 'validation_failed',
                errors: { 'rows.0.length': ['Required'] },
            }).errors,
        ).toEqual({ 'rows.0.length': ['Required'] })
        expect(() =>
            parseErrorEnvelope({
                message: 'Invalid',
                code: 'invalid',
                errors: { name: 'Required' },
            }),
        ).toThrow()
    })
    it('requires version and actor metadata while allowing nullable submission', () => {
        const record = {
            version: 1,
            createdByUserId: 'actor',
            submittedByUserId: null,
            allowedActions: ['update'],
        }
        expect(parseMetadata(record)).toEqual(record)
        expect(() => parseMetadata({ ...record, version: 0 })).toThrow()
        expect(() => parseMetadata({ ...record, submittedByUserId: undefined })).toThrow()
    })
})
