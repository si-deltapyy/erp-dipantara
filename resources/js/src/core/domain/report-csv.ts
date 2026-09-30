import type { ProductionRow } from '@/core/types/production'
import type { PurchasePriceRow } from '@/core/types/purchase-price-report'
export type CsvCell = string | number | null | { readonly decimal: string }
function csvCell(cell: CsvCell): string {
    if (cell === null) return ''
    if (typeof cell === 'number') return String(cell)
    if (typeof cell === 'object') return cell.decimal
    const firstCode = cell.charCodeAt(0)
    const unsafe = firstCode < 32 || firstCode === 127 || /^\s*[=+\-@]/.test(cell)
    const safe = unsafe ? "'" + cell : cell
    return '"' + safe.replaceAll('"', '""') + '"'
}
export function encodeCsv(rows: readonly (readonly CsvCell[])[]): string {
    return '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
const productionHeaders = [
    'period',
    'timberProductId',
    'timberProductName',
    'category',
    'quantity',
    'volumeM3',
]
function productionCells(row: ProductionRow): readonly CsvCell[] {
    return [
        row.period,
        row.timberProductId,
        row.timberProductName,
        row.category,
        row.quantity,
        { decimal: row.volumeM3 },
    ]
}
export function productionCsv(rows: readonly ProductionRow[]): string {
    return encodeCsv([productionHeaders, ...rows.map(productionCells)])
}
export function purchasePriceCsv(rows: readonly PurchasePriceRow[]): string {
    return encodeCsv([
        [
            ...productionHeaders,
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
        ...rows.map((row) => [
            ...productionCells(row),
            row.purchaseOrderId,
            row.purchaseOrderNumber,
            row.mitraId,
            row.mitraName,
            row.sourceStatus,
            row.unitPrice === null ? null : { decimal: row.unitPrice },
            row.totalAmount === null ? null : { decimal: row.totalAmount },
            row.priceBasis,
            row.priceAsOf,
        ]),
    ])
}
