import type { SessionUser } from '@/core/types/session'
import type { Grading } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import type { ProductionRow, ProductionCategory } from '@/core/types/production'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { gradingAccess } from '../grading-policy'
import { sumGradingVolumes } from '../grading-volume'
export interface ProductionSource {
    readonly grading: Grading
    readonly assignment: Assignment
}
export async function scopedProductionSource(
    transaction: DemoTransaction,
    actor: SessionUser,
    operation: 'dashboard.read' | 'reports.read',
): Promise<readonly ProductionSource[]> {
    const assignments = new Map(
        (await transaction.list('assignments')).map((assignment) => [assignment.id, assignment]),
    )
    const source: ProductionSource[] = []
    for (const grading of await transaction.list('gradings')) {
        const assignment = assignments.get(grading.assignmentId)
        if (!assignment || grading.status !== 'approved') continue
        const scope = gradingAccess(grading, assignment)
        if (
            evaluateRecordAccess(actor, operation, scope) !== 'allowed' ||
            evaluateRecordAccess(actor, 'gradings.read', scope) !== 'allowed'
        )
            continue
        source.push({ grading, assignment })
    }
    return source
}
export function productionCategory(diameterCm: string): ProductionCategory {
    const diameter = Number(diameterCm)
    if (!Number.isFinite(diameter) || diameter <= 0) throw new ApiError('unexpected')
    return diameter < 20 ? 'A1' : diameter < 30 ? 'A2' : 'A3'
}
export function aggregateProduction(
    source: readonly ProductionSource[],
    period: string,
): readonly ProductionRow[] {
    const groups = new Map<string, ProductionRow>()
    for (const { grading } of source) {
        if (!grading.gradingDate.startsWith(period + '-')) continue
        for (const row of grading.rows) {
            const result = grading.rowResults.find((candidate) => candidate.rowId === row.rowId)
            if (!result || !/^\d+\.\d{6}$/.test(result.volumeM3)) throw new ApiError('unexpected')
            const category = productionCategory(row.diameterCm)
            const key = `${row.timberProductId}:${category}`
            const previous = groups.get(key)
            groups.set(key, {
                period,
                timberProductId: row.timberProductId,
                timberProductName: result.timberProductName,
                category,
                quantity: (previous?.quantity ?? 0) + row.quantity,
                volumeM3: sumGradingVolumes([...(previous ? [previous] : []), result]),
            })
        }
    }
    return [...groups.values()].sort(
        (a, b) =>
            a.timberProductId.localeCompare(b.timberProductId) ||
            a.category.localeCompare(b.category),
    )
}
