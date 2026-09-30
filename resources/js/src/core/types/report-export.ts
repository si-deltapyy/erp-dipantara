import type { ReportFilters } from './report'
export type ReportKind = 'production' | 'purchase_prices'
export interface ReportExportInput {
    readonly kind: ReportKind
    readonly period: string
    readonly format: 'csv'
    readonly filters: ReportFilters & {
        readonly search?: string
        readonly sort?: 'createdAt' | '-createdAt'
    }
}
