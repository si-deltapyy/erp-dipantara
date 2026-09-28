import type { SessionUser } from '@/core/types/session'
import type { GraderDashboard } from '@/core/types/production'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { evaluateRecordAccess, hasBusinessPermission } from '@/core/domain/record-policy'
import { scopedProductionSource, aggregateProduction } from './production-projector'
import { hasDashboardDrilldown } from './dashboard-policy'
export async function graderDashboard(
    transaction: DemoTransaction,
    actor: SessionUser,
    period: string,
): Promise<GraderDashboard | null> {
    if (
        !actor.permissions.includes('dashboard.read.assigned') ||
        actor.permissions.includes('dashboard.read.all') ||
        !hasDashboardDrilldown(actor, 'assignments.read') ||
        !hasBusinessPermission(actor, 'gradings.read')
    )
        return null
    const assignments = (await transaction.list('assignments')).filter(
        (assignment) =>
            evaluateRecordAccess(actor, 'dashboard.read', assignment) === 'allowed' &&
            evaluateRecordAccess(actor, 'assignments.read', assignment) === 'allowed',
    )
    const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
    const source = (await scopedProductionSource(transaction, actor, 'dashboard.read')).filter(
        ({ assignment }) => assignmentIds.has(assignment.id),
    )
    const assignedQuantity = assignments.reduce(
        (total, assignment) => total + assignment.quantity,
        0,
    )
    const approvedQuantity = source.reduce(
        (total, { grading }) => total + grading.rows.reduce((sum, row) => sum + row.quantity, 0),
        0,
    )
    if (approvedQuantity > assignedQuantity) throw new ApiError('unexpected')
    return {
        period,
        assignments: {
            count: assignments.length,
            assignedQuantity,
            approvedQuantity,
            remainingQuantity: assignedQuantity - approvedQuantity,
            targetPath: '/assignments',
        },
        production: aggregateProduction(source, period),
    }
}
