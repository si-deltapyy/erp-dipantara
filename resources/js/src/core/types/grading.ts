import type { RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
import type { WorkflowApi, WorkflowWriteOptions } from './workflow'
export const gradingStatuses = ['draft', 'submitted', 'approved', 'rejected', 'superseded'] as const
export type GradingStatus = (typeof gradingStatuses)[number]
export interface GradingRow {
    readonly rowId: string
    readonly timberProductId: string
    readonly quantity: number
    readonly diameterCm: string
    readonly lengthM: string
    readonly gradeCode: string
}
export interface GradingInput {
    readonly assignmentId: string
    readonly gradingDate: string
    readonly rows: readonly GradingRow[]
}
export interface Grading extends GradingInput, RecordMetadata {
    readonly id: string
    readonly status: GradingStatus
    readonly purchaseOrderNumber: string
    readonly mitraName: string
    readonly graderName: string
    readonly totalVolumeM3: string
    readonly rowResults: readonly { rowId: string; volumeM3: string; timberProductName: string }[]
    readonly revisionOfId: string | null
    readonly rejectionReason: string | null
    readonly revisionReason: string | null
    readonly invoiceRevisionRequired: boolean
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface GradingQuery extends MasterListQuery {
    readonly assignmentId?: string
    readonly status?: GradingStatus
}
export interface GradingRevisionInput {
    readonly version: number
    readonly reason: string
    readonly gradingDate: string
    readonly rows: readonly GradingRow[]
}
export interface GradingRecord {
    readonly id: string
    readonly purchaseOrderNumber: string | null
    readonly mitraName: string | null
    readonly graderGroup: string | null
    readonly productName: string | null
    readonly gradingDate: string
    readonly notes: string | null
}
export interface GradingsApi extends WorkflowApi<Grading> {
    revise(id: string, input: GradingRevisionInput, options: WorkflowWriteOptions): Promise<Grading>
    list(query: GradingQuery, signal: AbortSignal): Promise<readonly GradingRecord[]>
    get(id: string, signal: AbortSignal): Promise<Grading>
    create(input: GradingInput, options: WorkflowWriteOptions): Promise<Grading>
    update(
        id: string,
        input: GradingInput & { version: number },
        options: WorkflowWriteOptions,
    ): Promise<Grading>
    subscribe(listener: () => void): () => void
    readonly previewVolume?: (
        rows: readonly GradingRow[],
    ) => readonly { rowId: string; volumeM3: string }[]
}
