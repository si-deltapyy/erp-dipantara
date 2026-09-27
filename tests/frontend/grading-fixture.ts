import type { Grading } from '../../resources/js/src/core/types/grading'
import { parseId } from '../../resources/js/src/api/contracts/value-parsers'
export const gradingFixture: Grading = {
    assignmentId: 'assignment-one',
    gradingDate: '2026-09-27',
    rows: [
        {
            rowId: 'row-one',
            timberProductId: 'timber-one',
            quantity: 2,
            diameterCm: '25.00',
            lengthM: '2.00',
            gradeCode: 'DEMO',
        },
    ],
    id: 'grading-one',
    version: 1,
    status: 'draft',
    purchaseOrderNumber: 'SYNTHETIC-PO',
    mitraName: 'Synthetic Mitra',
    graderName: 'Synthetic Grader',
    totalVolumeM3: '0.196350',
    rowResults: [{ rowId: 'row-one', volumeM3: '0.196350', timberProductName: 'Synthetic Timber' }],
    revisionOfId: null,
    revisionReason: null,
    rejectionReason: null,
    invoiceRevisionRequired: false,
    createdAt: '2026-09-27T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
    createdByUserId: parseId('grader-one'),
    submittedByUserId: null,
    allowedActions: ['update', 'submit'],
}
