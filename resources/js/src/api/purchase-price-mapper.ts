import type { PurchasePriceRow } from '@/core/types/purchase-price-report'
import { parseProductionRow } from './production-mapper'
import {
    parseObject,
    requireKeys,
    parseId,
    parseString,
    parseMoney,
    invalidContract,
} from './contracts/value-parsers'
export function parsePurchasePriceRow(value: unknown): PurchasePriceRow {
    const row = parseObject(value, 'purchasePrice')
    requireKeys(
        row,
        [
            'period',
            'timberProductId',
            'timberProductName',
            'category',
            'quantity',
            'volumeM3',
            'purchaseOrderId',
            'purchaseOrderNumber',
            'mitraId',
            'mitraName',
            'sourceStatus',
            'unitPrice',
            'totalAmount',
            'priceBasis',
            'priceAsOf',
        ],
        'purchasePrice',
    )
    const production = parseProductionRow({
        period: row.period,
        timberProductId: row.timberProductId,
        timberProductName: row.timberProductName,
        category: row.category,
        quantity: row.quantity,
        volumeM3: row.volumeM3,
    })
    const sourceStatus = row.sourceStatus
    if (sourceStatus !== 'missing_snapshot' && sourceStatus !== 'historical_snapshot')
        return invalidContract('sourceStatus')
    if (
        sourceStatus === 'missing_snapshot' &&
        [row.unitPrice, row.totalAmount, row.priceBasis, row.priceAsOf].some(
            (value) => value !== null,
        )
    )
        return invalidContract('sourceStatus')
    if (
        sourceStatus === 'historical_snapshot' &&
        (row.unitPrice === null ||
            row.totalAmount === null ||
            !['per_log', 'per_m3'].includes(String(row.priceBasis)) ||
            typeof row.priceAsOf !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}T/.test(row.priceAsOf) ||
            !Number.isFinite(Date.parse(row.priceAsOf)))
    )
        return invalidContract('priceAsOf')
    const unitPrice = row.unitPrice === null ? null : parseMoney(row.unitPrice)
    const totalAmount = row.totalAmount === null ? null : parseMoney(row.totalAmount)
    if (unitPrice?.startsWith('-') || totalAmount?.startsWith('-'))
        return invalidContract('unitPrice')
    return {
        ...production,
        purchaseOrderId: parseId(row.purchaseOrderId),
        purchaseOrderNumber: parseString(row.purchaseOrderNumber, 'purchaseOrderNumber'),
        mitraId: parseId(row.mitraId),
        mitraName: parseString(row.mitraName, 'mitraName'),
        sourceStatus,
        unitPrice,
        totalAmount,
        priceBasis:
            row.priceBasis === 'per_log'
                ? 'per_log'
                : row.priceBasis === 'per_m3'
                  ? 'per_m3'
                  : null,
        priceAsOf: row.priceAsOf === null ? null : parseString(row.priceAsOf, 'priceAsOf'),
    }
}
