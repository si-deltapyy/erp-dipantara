import type { Order } from '@/core/types/order'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
export async function resolveOrderLabels(
    transaction: DemoTransaction,
    order: Order,
): Promise<Order> {
    const po = await transaction.get('purchase-orders', order.purchaseOrderId)
    if (!po) throw new ApiError('not-found')
    const buyer = await transaction.get('buyers', po.buyerId)
    if (!buyer) throw new ApiError('not-found')
    return { ...order, purchaseOrderNumber: po.number, buyerName: buyer.companyName }
}
