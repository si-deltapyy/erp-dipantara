import type { RecordMetadata } from './contracts'
export type ReviewAction = 'approve' | 'reject'
export interface WorkflowRecord extends RecordMetadata {
    readonly id: string
    readonly status: string
    readonly snapshotGeneration?: string
}
export interface WorkflowVersion {
    readonly version: number
}
export interface WorkflowRejection extends WorkflowVersion {
    readonly reason: string
}
export interface WorkflowWriteOptions {
    readonly signal: AbortSignal
    readonly idempotencyKey: string
    readonly snapshotGeneration?: string
}
export interface WorkflowApi<T extends WorkflowRecord> {
    submit(id: string, input: WorkflowVersion, options: WorkflowWriteOptions): Promise<T>
    approve(id: string, input: WorkflowVersion, options: WorkflowWriteOptions): Promise<T>
    reject(id: string, input: WorkflowRejection, options: WorkflowWriteOptions): Promise<T>
}
export interface ReviewSnapshot<T extends WorkflowRecord> {
    readonly actorId: string
    readonly record: T
    readonly action: ReviewAction
    readonly reason: string
    readonly idempotencyKey: string
}
