import type { Assignment } from '@/core/types/assignment'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
export async function resolveAssignmentLabels(
    transaction: DemoTransaction,
    assignment: Assignment,
): Promise<Assignment> {
    const order = await transaction.get('orders', assignment.orderId)
    const po = order ? await transaction.get('purchase-orders', order.purchaseOrderId) : undefined
    const mitra = await transaction.get('mitras', assignment.mitraId)
    const grader = await transaction.get('graders', assignment.graderId)
    const timber = await transaction.get('timber-products', assignment.timberProductId)
    if (!order || !po || !mitra || !grader || !timber || !grader.userId)
        throw new ApiError('not-found')
    return {
        ...assignment,
        orderStatus: order.status,
        graderUserId: grader.userId,
        purchaseOrderNumber: po.number,
        mitraName: mitra.name,
        graderName: grader.name,
        timberProductName: timber.name,
        gradingReference: {
            timberProductId: timber.id,
            timberProductName: timber.name,
            gradeCodes: [timber.gradeCode],
        },
    }
}
