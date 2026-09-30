import { defineStore } from 'pinia'
import type { ReportExportInput } from '@/core/types/report-export'
import type { DocumentReference } from '@/core/types/document'
export interface ReportExportAttempt {
    readonly actorId: string
    readonly identity: string
    readonly input: ReportExportInput
    readonly idempotencyKey: string
    readonly document?: DocumentReference
}
export const useReportExportRecovery = defineStore('report-export-recovery', {
    state: (): { attempt: ReportExportAttempt | null } => ({ attempt: null }),
})
