import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'

export async function resolvePurchaseOrderLabels(
    transaction: DemoTransaction,
    order: PurchaseOrder,
): Promise<PurchaseOrder> {
    const buyer = await transaction.get('buyers', order.buyerId)
    if (!buyer) throw new ApiError('validation', { buyerId: ['purchase-orders.invalid'] })
    const lines = await Promise.all(
        order.lines.map(async (line, index) => {
            const timber = await transaction.get('timber-products', line.timberProductId)
            if (!timber)
                throw new ApiError('validation', {
                    [`lines.${index}.timberProductId`]: ['purchase-orders.invalid'],
                })
            return { ...line, timberProductName: timber.name }
        }),
    )
    return {
        ...order,
        rejectionReason: order.rejectionReason ?? null,
        buyerName: buyer.companyName,
        lines,
    }
}
