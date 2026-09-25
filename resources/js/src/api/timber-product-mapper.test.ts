import { expect, test } from 'vitest'
import {
    parseTimberProduct,
    parseTimberProductInput,
    parseTimberProductLookup,
} from './timber-product-mapper'
import { timberProductFixtures } from './mocks/timber-product-fixtures'
import {
    emptyTimberProduct,
    normalizeTimberInput,
    timberProductDraft,
    validateTimberProduct,
} from '@/core/domain/timber-product-validation'

const product = timberProductFixtures[0]
if (!product) throw new Error('Missing fixture')
test('keeps decimal precision and distinguishes writable input from calculated output', () => {
    const input = timberProductDraft(product)
    expect(parseTimberProductInput(input)).toEqual(input)
    expect(parseTimberProductInput({ ...input, version: 3 }, true)).toEqual({
        ...input,
        version: 3,
    })
    expect(() => parseTimberProductInput({ ...input, volumeM3: '1.000000' })).toThrow()
    expect(() => parseTimberProductInput({ ...input, snapshotGeneration: 'local' })).toThrow()
    expect(parseTimberProductInput({ ...input, salePrice: '9007199254740993.01' })).toMatchObject({
        salePrice: '9007199254740993.01',
    })
})
test.each(['0', '-1', '1.001', '1e3', 'NaN', 'Infinity', '1,2'])(
    'rejects invalid wire dimensions %s',
    (diameterCm) => {
        expect(() =>
            parseTimberProductInput({ ...timberProductDraft(product), diameterCm }),
        ).toThrow()
    },
)
test.each(['-1.00', '1', '1.001', 1])('rejects invalid wire prices %s', (purchasePrice) => {
    expect(() =>
        parseTimberProductInput({ ...timberProductDraft(product), purchasePrice }),
    ).toThrow()
})
test('accepts redacted prices while rejecting partial price pairs and lookup leakage', () => {
    const { purchasePrice, salePrice, ...redacted } = product
    expect(purchasePrice).toBeDefined()
    expect(salePrice).toBeDefined()
    expect(parseTimberProduct(redacted)).not.toHaveProperty('purchasePrice')
    expect(() => parseTimberProduct({ ...redacted, salePrice: '1.00' })).toThrow()
    expect(() =>
        parseTimberProductLookup({ id: product.id, label: product.name, purchasePrice: '1.00' }),
    ).toThrow()
})
test('validates required fields and normalizes Indonesian decimal drafts', () => {
    expect(Object.keys(validateTimberProduct(emptyTimberProduct()))).toHaveLength(6)
    const input = {
        ...timberProductDraft(product),
        name: ' Kayu ',
        diameterCm: '20,5',
        purchasePrice: '100,5',
        salePrice: '0',
    }
    expect(validateTimberProduct(input)).toEqual({})
    expect(normalizeTimberInput(input)).toMatchObject({
        name: 'Kayu',
        diameterCm: '20.5',
        purchasePrice: '100.50',
        salePrice: '0.00',
    })
    expect(validateTimberProduct({ ...input, gradeCode: ' '.repeat(5) })).toHaveProperty(
        'gradeCode',
    )
    expect(validateTimberProduct({ ...input, name: 'a'.repeat(256) })).toHaveProperty('name')
})
