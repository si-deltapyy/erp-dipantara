import { isCalendarDate, isRecordId } from './input-validation'
import type { GradingInput, GradingRow, GradingCreateInput } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import { isTimberDimension } from './timber-measurements'
export function newGradingRow(assignment: Assignment): GradingRow {
    return {
        rowId: crypto.randomUUID(),
        timberProductId: assignment.timberProductId,
        quantity: 1,
        diameterCm: '',
        lengthM: '',
        gradeCode: assignment.gradingReference.gradeCodes[0] ?? '',
    }
}
export function gradingDraft(input?: GradingInput, assignment?: Assignment): GradingInput {
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return input
        ? {
              assignmentId: input.assignmentId,
              gradingDate: input.gradingDate,
              rows: input.rows.map((row) => ({ ...row })),
          }
        : {
              assignmentId: assignment?.id ?? '',
              gradingDate: date,
              rows: assignment ? [newGradingRow(assignment)] : [],
          }
}
export function validateGrading(input: GradingInput): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!input.assignmentId) errors.assignmentId = 'gradings.required'
    if (!isCalendarDate(input.gradingDate)) errors.gradingDate = 'gradings.invalid'
    if (!input.rows.length) errors.rows = 'gradings.required'
    input.rows.forEach((row, index) => {
        if (!Number.isSafeInteger(row.quantity) || row.quantity < 1)
            errors[`rows.${index}.quantity`] = 'gradings.invalid'
        if (!isTimberDimension(row.diameterCm))
            errors[`rows.${index}.diameterCm`] = 'gradings.invalid'
        if (!isTimberDimension(row.lengthM)) errors[`rows.${index}.lengthM`] = 'gradings.invalid'
        if (!row.gradeCode.trim()) errors[`rows.${index}.gradeCode`] = 'gradings.invalid'
    })
    return errors
}

export function emptyGradingCreate(): GradingCreateInput {
    return {
        purchaseOrderId: '',
        mitraId: '',
        graderId: '',
        productId: '',
        gradingDate: '',
        notes: '',
    }
}
export function validateGradingCreate(
    input: GradingCreateInput,
): Partial<Record<keyof GradingCreateInput, string>> {
    const errors: Partial<Record<keyof GradingCreateInput, string>> = {}
    for (const field of [
        'purchaseOrderId',
        'mitraId',
        'graderId',
        'productId',
        'gradingDate',
    ] as const)
        if (!input[field].trim()) errors[field] = 'gradings.required'
    if (!isCalendarDate(input.gradingDate)) errors.gradingDate = 'ui.validation.date'
    if ([...input.notes].length > 255) errors.notes = 'ui.validation.textLength'
    for (const field of ['purchaseOrderId', 'mitraId', 'graderId', 'productId'] as const)
        if (input[field] && !isRecordId(input[field])) errors[field] = 'ui.validation.selection'
    return errors
}
