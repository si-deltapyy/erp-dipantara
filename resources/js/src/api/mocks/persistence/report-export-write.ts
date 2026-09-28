import type { DemoTransaction } from './transaction'
import type { SessionUser } from '@/core/types/session'
import type { ReportExportInput } from '@/core/types/report-export'
import type { DocumentReference } from '@/core/types/document'
import type { StoredReportExport } from './report-export-schema'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { productionCsv, purchasePriceCsv } from '@/core/domain/report-csv'
import { exportReportQuery } from '@/api/report-export-mapper'
import { filteredProductionSource, productionReportRows } from './report-projection'
import { purchasePriceRows } from './purchase-price-projection'
import { requireDataset } from './demo-repository'
import { assertExportAccess } from './report-export-policy'
import { gradingAccess } from '../grading-policy'
export interface ExportAttempt {
    readonly input: ReportExportInput
    readonly key: string
    readonly hash: string
    readonly generation: string
}
export async function writeReportExport(
    transaction: DemoTransaction,
    actor: SessionUser,
    attempt: ExportAttempt,
): Promise<DocumentReference> {
    const metadata = await requireDataset(transaction)
    if (metadata.generation !== attempt.generation) throw new ApiError('conflict')
    const receiptId = JSON.stringify([actor.id, 'POST', '/api/v1/reports/exports', attempt.key])
    const receipt = await transaction.get('documentMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== attempt.hash) throw new ApiError('conflict')
        const report = await transaction.get('reportExports', receipt.documentId)
        const document = await transaction.get('documents', receipt.documentId)
        if (!report || !document) throw new ApiError('not-found')
        await assertExportAccess(transaction, actor, report, 'download')
        return {
            id: document.id,
            fileName: document.fileName,
            sizeBytes: document.sizeBytes,
            mimeType: document.mimeType,
        }
    }
    return createReportExport(transaction, actor, attempt, receiptId)
}
async function createReportExport(
    transaction: DemoTransaction,
    actor: SessionUser,
    attempt: ExportAttempt,
    receiptId: string,
): Promise<DocumentReference> {
    const query = exportReportQuery(attempt.input)
    const source = await filteredProductionSource(transaction, actor, query)
    for (const entry of source)
        assertRecordAccess(actor, 'reports.export', gradingAccess(entry.grading, entry.assignment))
    const content =
        attempt.input.kind === 'production'
            ? productionCsv(await productionReportRows(transaction, actor, query))
            : purchasePriceCsv(await purchasePriceRows(transaction, actor, query))
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const id = crypto.randomUUID()
    const reference = {
        id,
        fileName: `${attempt.input.kind}-${query.period}.csv`,
        mimeType: 'text/csv',
        sizeBytes: blob.size,
    }
    const report: StoredReportExport = {
        id,
        createdByUserId: actor.id,
        generation: attempt.generation,
        input: attempt.input,
        sources: source.map((entry) => ({
            gradingId: entry.grading.id,
            assignmentId: entry.assignment.id,
        })),
    }
    await assertExportAccess(transaction, actor, report, 'download')
    await transaction.put('reportExports', report)
    await transaction.put('documents', {
        ...reference,
        parentType: 'report',
        parentId: id,
        purpose: 'report_csv',
        createdByUserId: actor.id,
        expiresAt: null,
        content: blob,
    })
    await transaction.put('documentMutations', {
        id: receiptId,
        documentId: id,
        payloadHash: attempt.hash,
        expiresAt: Date.now() + 86400000,
    })
    const metadata = await requireDataset(transaction)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    return reference
}
