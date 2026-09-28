import { expect, test } from 'vitest'
import { parsePurchasePriceRow } from './purchase-price-mapper'
const row = {
    period: '2026-09',
    timberProductId: 'wood',
    timberProductName: 'Wood',
    category: 'A2',
    quantity: 2,
    volumeM3: '0.250000',
    purchaseOrderId: 'po',
    purchaseOrderNumber: 'PO',
    mitraId: 'mitra',
    mitraName: 'Partner',
    sourceStatus: 'missing_snapshot',
    unitPrice: null,
    totalAmount: null,
    priceBasis: null,
    priceAsOf: null,
}
test('preserves unavailable prices and rejects fabricated amounts without snapshots', () => {
    expect(parsePurchasePriceRow(row)).toEqual(row)
    expect(() => parsePurchasePriceRow({ ...row, unitPrice: '100.00' })).toThrow()
    expect(() => parsePurchasePriceRow({ ...row, sourceStatus: 'historical_snapshot' })).toThrow()
})
test('accepts historical amounts only with their basis and timestamp', () => {
    const historical = {
        ...row,
        sourceStatus: 'historical_snapshot',
        unitPrice: '100.00',
        totalAmount: '200.00',
        priceBasis: 'per_log',
        priceAsOf: '2026-09-29T00:00:00Z',
    }
    expect(parsePurchasePriceRow(historical)).toEqual(historical)
    expect(() => parsePurchasePriceRow({ ...historical, totalAmount: '-1.00' })).toThrow()
})
