import type { SessionUser } from '@/core/types/session'
import type { ReportKind } from '@/core/types/report-export'
import type { DemoTransaction } from './transaction'
import type { StoredReportExport } from './report-export-schema'
import { ApiError } from '@/core/types/api-error'
import { hasBusinessPermission, assertRecordAccess } from '@/core/domain/record-policy'
import { requireReportActor } from './report-projection'
import { requirePurchasePriceActor } from './purchase-price-projection'
import { gradingAccess } from '../grading-policy'
import { requireDataset } from './demo-repository'
export function requireExportActor(user: SessionUser | null, kind: ReportKind): SessionUser {
    const actor =
        kind === 'purchase_prices' ? requirePurchasePriceActor(user) : requireReportActor(user)
    if (!hasBusinessPermission(actor, 'reports.export')) throw new ApiError('forbidden')
    return actor
}
export async function assertExportAccess(
    transaction: DemoTransaction,
    actor: SessionUser,
    report: StoredReportExport,
    action: 'read' | 'download',
): Promise<void> {
    requireExportActor(actor, report.input.kind)
    if (actor.id !== report.createdByUserId) throw new ApiError('not-found')
    const metadata = await requireDataset(transaction)
    if (report.generation !== metadata.generation) throw new ApiError('not-found')
    assertRecordAccess(actor, `documents.${action}`, {
        createdByUserId: actor.id,
        graderUserId: actor.id,
    })
    for (const source of report.sources) {
        const grading = await transaction.get('gradings', source.gradingId)
        const assignment = await transaction.get('assignments', source.assignmentId)
        if (!grading || !assignment || grading.assignmentId !== assignment.id)
            throw new ApiError('not-found')
        const scope = gradingAccess(grading, assignment)
        assertRecordAccess(actor, 'reports.read', scope)
        assertRecordAccess(actor, 'reports.export', scope)
        assertRecordAccess(actor, 'gradings.read', scope)
        assertRecordAccess(actor, `documents.${action}`, {
            ...scope,
            createdByUserId: report.createdByUserId,
        })
    }
}
