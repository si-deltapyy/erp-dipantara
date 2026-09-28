export const productionCategories = ['A1', 'A2', 'A3'] as const
export type ProductionCategory = (typeof productionCategories)[number]
export interface ProductionRow {
    readonly period: string
    readonly timberProductId: string
    readonly timberProductName: string
    readonly category: ProductionCategory
    readonly quantity: number
    readonly volumeM3: string
}
export interface GraderDashboard {
    readonly period: string
    readonly assignments: {
        readonly count: number
        readonly assignedQuantity: number
        readonly approvedQuantity: number
        readonly remainingQuantity: number
        readonly targetPath: '/assignments'
    }
    readonly production: readonly ProductionRow[]
}
