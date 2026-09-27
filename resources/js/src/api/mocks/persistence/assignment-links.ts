import type { DemoTransaction } from './transaction'
import type { MitraTransactionLink } from '../mitra-lookup-scope'
import type { TimberProductTransactionLink } from '../timber-product-lookup-scope'
export async function resolveMitraLinks(
    transaction: DemoTransaction,
): Promise<readonly MitraTransactionLink[]> {
    const assignments = await transaction.list('assignments')
    const orders = new Map((await transaction.list('orders')).map((order) => [order.id, order]))
    const parents = new Map((await transaction.list('purchase-orders')).map((po) => [po.id, po]))
    return assignments.flatMap((assignment) => {
        const order = orders.get(assignment.orderId)
        const po = order ? parents.get(order.purchaseOrderId) : undefined
        return po
            ? [
                  {
                      mitraId: assignment.mitraId,
                      ownerUserId: po.createdByUserId,
                      assignedUserIds: [assignment.graderUserId],
                  },
              ]
            : []
    })
}
export async function resolveTimberLinks(
    transaction: DemoTransaction,
): Promise<readonly TimberProductTransactionLink[]> {
    return (await transaction.list('assignments')).map((assignment) => ({
        timberProductId: assignment.timberProductId,
        graderUserId: assignment.graderUserId,
    }))
}
