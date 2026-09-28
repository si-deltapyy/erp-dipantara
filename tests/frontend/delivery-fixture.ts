import type { Delivery } from '../../resources/js/src/core/types/delivery'
import { parseId } from '../../resources/js/src/api/contracts/value-parsers'
export const deliveryFixture: Delivery = {
    id: 'delivery-one',
    purchaseOrderId: 'po-one',
    purchaseOrderNumber: 'DEMO-PO-001',
    buyerName: 'Buyer Simulasi',
    licensePlate: 'DEMO 01',
    deliveryDate: '2026-09-28',
    status: 'draft',
    documents: [],
    allocations: [{ gradingId: 'grading-one', rowId: 'row-one', quantity: 200 }],
    allocationContext: [
        {
            gradingId: 'grading-one',
            rowId: 'row-one',
            quantity: 200,
            assignmentId: 'assignment-one',
            mitraName: 'Mitra Simulasi',
            timberProductName: 'Kayu Simulasi',
        },
    ],
    version: 1,
    createdByUserId: parseId('maker-demo'),
    submittedByUserId: null,
    allowedActions: ['update'],
    createdAt: '2026-09-28T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z',
}
