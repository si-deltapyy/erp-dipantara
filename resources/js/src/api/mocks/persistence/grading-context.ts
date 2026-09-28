import type { Grading, GradingInput } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { resolveAssignmentLabels } from './assignment-labels'
import { previewGradingVolume, sumGradingVolumes } from '../grading-volume'
export async function gradingAssignment(
    transaction: DemoTransaction,
    id: string,
): Promise<Assignment> {
    const assignment = await transaction.get('assignments', id)
    if (!assignment) throw new ApiError('not-found')
    return resolveAssignmentLabels(transaction, assignment)
}
export function labelGrading(record: Grading, assignment: Assignment): Grading {
    return {
        ...record,
        purchaseOrderNumber: assignment.purchaseOrderNumber,
        mitraName: assignment.mitraName,
        graderName: assignment.graderName,
        rowResults: record.rowResults.map((result) => ({
            ...result,
            timberProductName: assignment.timberProductName,
        })),
    }
}
export function calculateGrading(
    input: GradingInput,
    assignment: Assignment,
): Pick<Grading, 'rowResults' | 'totalVolumeM3'> {
    const rowResults = previewGradingVolume(input.rows).map((result) => ({
        ...result,
        timberProductName: assignment.timberProductName,
    }))
    return { rowResults, totalVolumeM3: sumGradingVolumes(rowResults) }
}
export async function assertGradingCapacity(
    transaction: DemoTransaction,
    input: GradingInput,
    assignment: Assignment,
    excludeIds: readonly string[] = [],
): Promise<void> {
    for (const [index, row] of input.rows.entries()) {
        if (row.timberProductId !== assignment.timberProductId)
            throw new ApiError('validation', {
                [`rows.${index}.timberProductId`]: ['gradings.invalidTimber'],
            })
        if (!assignment.gradingReference.gradeCodes.includes(row.gradeCode))
            throw new ApiError('validation', {
                [`rows.${index}.gradeCode`]: ['gradings.invalidGrade'],
            })
    }
    const records = await transaction.list('gradings')
    const existing = records.filter(
        (grading) =>
            grading.assignmentId === assignment.id &&
            grading.status !== 'superseded' &&
            !excludeIds.includes(grading.id) &&
            !(
                grading.revisionOfId &&
                records.some(
                    (parent) => parent.id === grading.revisionOfId && parent.status === 'approved',
                )
            ),
    )
    const allocated = [...existing.flatMap((grading) => grading.rows), ...input.rows].reduce(
        (sum, row) => sum + BigInt(row.quantity),
        0n,
    )
    if (allocated > BigInt(assignment.quantity))
        throw new ApiError('validation', { rows: ['gradings.capacity'] })
}
