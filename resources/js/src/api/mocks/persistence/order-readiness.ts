import type { Order } from '@/core/types/order'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
export async function assertOrderReady(transaction: DemoTransaction, order: Order): Promise<void> {
    const po = await transaction.get('purchase-orders', order.purchaseOrderId)
    if (!po || po.status !== 'approved') throw new ApiError('conflict')
    const assignments = (await transaction.list('assignments')).filter(
        (assignment) => assignment.orderId === order.id,
    )
    if (!assignments.length)
        throw new ApiError('validation', { assignments: ['orders.incomplete'] })
    const required = new Map<string, number>()
    for (const line of po.lines)
        required.set(
            line.timberProductId,
            (required.get(line.timberProductId) ?? 0) + line.quantity,
        )
    const allocated = new Map<string, number>()
    for (const assignment of assignments) {
        const grader = await transaction.get('graders', assignment.graderId)
        if (
            !grader ||
            grader.provisioningStatus !== 'active' ||
            !grader.userId ||
            grader.userId !== assignment.graderUserId
        )
            throw new ApiError('validation', { assignments: ['assignments.inactiveGrader'] })
        if (!required.has(assignment.timberProductId)) throw new ApiError('conflict')
        allocated.set(
            assignment.timberProductId,
            (allocated.get(assignment.timberProductId) ?? 0) + assignment.quantity,
        )
    }
    if ([...required].some(([id, quantity]) => allocated.get(id) !== quantity))
        throw new ApiError('validation', { assignments: ['orders.incomplete'] })
}
