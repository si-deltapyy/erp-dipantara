import type { ReportExportInput } from '@/core/types/report-export'
export interface StoredReportExport {
    readonly id: string
    readonly createdByUserId: string
    readonly generation: string
    readonly input: ReportExportInput
    readonly sources: readonly { readonly gradingId: string; readonly assignmentId: string }[]
}
