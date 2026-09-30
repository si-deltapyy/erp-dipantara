import type { ProductionRow } from './production'
export interface PurchasePriceRow extends ProductionRow {
    readonly purchaseOrderId: string
    readonly purchaseOrderNumber: string
    readonly mitraId: string
    readonly mitraName: string
    readonly sourceStatus: 'missing_snapshot' | 'historical_snapshot'
    readonly unitPrice: string | null
    readonly totalAmount: string | null
    readonly priceBasis: 'per_log' | 'per_m3' | null
    readonly priceAsOf: string | null
}
