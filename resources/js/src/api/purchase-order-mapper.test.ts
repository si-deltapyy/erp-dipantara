import { expect, test } from 'vitest'
import { purchaseOrderFixtures } from './mocks/purchase-order-fixtures'
import {
    parsePurchaseOrder,
    parsePurchaseOrderInput,
    parsePurchaseOrderQuery,
    parsePurchaseOrderVersion,
    parsePurchaseOrderRejection,
} from './purchase-order-mapper'
import { purchaseOrderDraft } from '@/core/domain/purchase-order-draft'
import { calculatePurchaseOrderTotal } from './mocks/purchase-order-total'
import { hashMutationPayload } from './mocks/persistence/idempotency'

const order = purchaseOrderFixtures[0]
if (!order) throw new Error('Missing fixture')
test('requires safe labels and rejects read-only fields in requests', () => {
    expect(parsePurchaseOrder(order)).toEqual(order)
    expect(() => parsePurchaseOrder({ ...order, buyerName: undefined })).toThrow()
    expect(() =>
        parsePurchaseOrder({
            ...order,
            lines: [{ timberProductId: 'a', quantity: 1, unitPrice: '1.00' }],
        }),
    ).toThrow()
    expect(() =>
        parsePurchaseOrderInput({ ...purchaseOrderDraft(order), buyerName: 'forged' }),
    ).toThrow()
    expect(() =>
        parsePurchaseOrderInput({ ...purchaseOrderDraft(order), orderDate: '2026-02-30' }),
    ).toThrow()
    expect(() =>
        parsePurchaseOrderInput({
            ...purchaseOrderDraft(order),
            lines: [{ timberProductId: 'a', quantity: 0, unitPrice: '1.00' }],
        }),
    ).toThrow()
    expect(() => parsePurchaseOrderVersion({ version: 1, status: 'approved' })).toThrow()
    expect(
        parsePurchaseOrderQuery({
            page: 1,
            perPage: 20,
            search: '',
            sort: '-createdAt',
            buyerId: 'a',
            status: 'closed',
        }).status,
    ).toBe('closed')
})
test('calculates exact decimal totals beyond floating point precision', () => {
    expect(
        calculatePurchaseOrderTotal([{ timberProductId: 'a', quantity: 3, unitPrice: '0.10' }]),
    ).toBe('0.30')
    expect(
        calculatePurchaseOrderTotal([
            { timberProductId: 'a', quantity: 2, unitPrice: '9007199254740993.01' },
        ]),
    ).toBe('18014398509481986.02')
})
test('hashes nested values canonically without losing array order or flat compatibility', async () => {
    const a = { lines: [{ quantity: 2, unitPrice: '1.00' }], notes: null }
    expect(await hashMutationPayload(a)).toBe(
        await hashMutationPayload({ notes: null, lines: [{ unitPrice: '1.00', quantity: 2 }] }),
    )
    expect(await hashMutationPayload(a)).not.toBe(
        await hashMutationPayload({ ...a, lines: [{ quantity: 3, unitPrice: '1.00' }] }),
    )
    expect(await hashMutationPayload({ lines: [1, 2] })).not.toBe(
        await hashMutationPayload({ lines: [2, 1] }),
    )
    const original = JSON.stringify({ a: 'one', z: 2 })
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(original))
    const expected = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('')
    expect(await hashMutationPayload({ z: 2, a: 'one' })).toBe(expected)
})

test('requires the readonly rejection reason and validates reject input', () => {
    expect(() => parsePurchaseOrder({ ...order, rejectionReason: undefined })).toThrow()
    expect(() => parsePurchaseOrder({ ...order, rejectionReason: 'x'.repeat(2001) })).toThrow()
    expect(() =>
        parsePurchaseOrderInput({ ...purchaseOrderDraft(order), rejectionReason: 'forged' }),
    ).toThrow()
    for (const reason of ['', '   ', 'x'.repeat(2001)])
        expect(() => parsePurchaseOrderRejection({ version: 1, reason })).toThrow()
    expect(parsePurchaseOrderRejection({ version: 1, reason: ' revise ' })).toEqual({
        version: 1,
        reason: 'revise',
    })
    expect(() =>
        parsePurchaseOrderRejection({ version: 1, reason: 'revise', createdByUserId: 'forged' }),
    ).toThrow()
})
