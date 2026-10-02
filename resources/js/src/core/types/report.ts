import type { DocumentReference } from './document'
import type { WorkflowWriteOptions } from './workflow'
import type { ReportExportInput } from './report-export'
import type { PurchasePriceRow } from './purchase-price-report'
import type { MasterListQuery } from './master-list'
import type { PageResponse } from './contracts'
import type { ProductionRow, ProductionCategory } from './production'
export interface ReportFilters {
    readonly buyerId?: string
    readonly mitraId?: string
    readonly graderId?: string
    readonly timberProductId?: string
    readonly category?: ProductionCategory
}
export interface ReportQuery extends MasterListQuery, ReportFilters {
    readonly period: string
}
export interface ReportsApi {
    export(input: ReportExportInput, options: WorkflowWriteOptions): Promise<DocumentReference>
    purchasePrices(query: ReportQuery, signal: AbortSignal): Promise<PageResponse<PurchasePriceRow>>
    production(query: ReportQuery, signal: AbortSignal): Promise<PageResponse<ProductionRow>>
    subscribe(listener: () => void): () => void
}
