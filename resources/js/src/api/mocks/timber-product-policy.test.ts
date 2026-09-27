import { expect, test } from 'vitest'
import { sessionFixtures } from './session-fixtures'
import { timberProductFixtures } from './timber-product-fixtures'
import {
    canLookupTimberProduct,
    timberProductTransactionFixtures,
} from './timber-product-lookup-scope'
import { presentTimberProduct, requireTimberProductPermission } from './timber-product-policy'
import type { SessionUser } from '@/core/types/session'

function actor(permissions: readonly string[], id = 'grader-one'): SessionUser {
    const template = sessionFixtures[0]
    if (!template) throw new Error('Missing fixture')
    return { ...template, id, roles: ['Admin'], permissions }
}
test('requires operation and price permissions independently of role names', () => {
    expect(() => requireTimberProductPermission(null, 'read')).toThrow()
    expect(() => requireTimberProductPermission(actor([]), 'read')).toThrow()
    expect(() =>
        requireTimberProductPermission(actor(['timber-products.create.all']), 'create'),
    ).toThrow()
    expect(() =>
        requireTimberProductPermission(actor(['timber-prices.read.all']), 'create'),
    ).toThrow()
    expect(
        requireTimberProductPermission(
            actor(['timber-products.create.all', 'timber-prices.read.all']),
            'create',
        ),
    ).toBeDefined()
})
test('redacts both prices and update actions without price access', () => {
    const product = timberProductFixtures[0]
    if (!product) throw new Error('Missing fixture')
    const response = presentTimberProduct(product, actor(['timber-products.update.all']))
    expect(Object.keys(response)).not.toContain('purchasePrice')
    expect(Object.keys(response)).not.toContain('salePrice')
    expect(response.allowedActions).toEqual([])
    expect(
        presentTimberProduct(
            product,
            actor(['timber-products.update.all', 'timber-prices.read.all']),
        ).allowedActions,
    ).toEqual(['update'])
})
test('filters assigned lookup by session identity and returns no records without links', () => {
    const grader = actor(['timber-products.lookup.assigned'])
    expect(canLookupTimberProduct('demo-timber-01', grader, timberProductTransactionFixtures)).toBe(
        true,
    )
    expect(canLookupTimberProduct('demo-timber-02', grader, timberProductTransactionFixtures)).toBe(
        false,
    )
    expect(canLookupTimberProduct('demo-timber-01', grader, [])).toBe(false)
    expect(
        canLookupTimberProduct('demo-timber-01', actor([]), timberProductTransactionFixtures),
    ).toBe(false)
})
test.each(['own', 'all'])(
    'allows minimum catalog lookup for %s without prior transactions',
    (scope) => {
        expect(
            canLookupTimberProduct(
                'demo-timber-01',
                actor([`timber-products.lookup.${scope}`]),
                [],
            ),
        ).toBe(true)
    },
)
