import type { AssignmentInput } from '@/core/types/assignment'
import type { DemoTransaction } from './transaction'
import type { Order } from '@/core/types/order'
import { ApiError } from '@/core/types/api-error'
export async function assertAssignmentCapacity(
    transaction: DemoTransaction,
    order: Order,
    input: AssignmentInput,
    id?: string,
): Promise<void> {
    const po = await transaction.get('purchase-orders', order.purchaseOrderId)
    if (!po || po.status !== 'approved') throw new ApiError('conflict')
    const required = po.lines
        .filter((line) => line.timberProductId === input.timberProductId)
        .reduce((sum, line) => sum + line.quantity, 0)
    if (!required)
        throw new ApiError('validation', { timberProductId: ['assignments.invalidTimber'] })
    const siblings = (await transaction.list('assignments')).filter(
        (assignment) =>
            assignment.orderId === order.id &&
            assignment.timberProductId === input.timberProductId &&
            assignment.id !== id,
    )
    const allocated = siblings.reduce((sum, assignment) => sum + assignment.quantity, 0)
    if (!Number.isSafeInteger(allocated + input.quantity) || allocated + input.quantity > required)
        throw new ApiError('conflict', { quantity: ['assignments.capacity'] })
}
