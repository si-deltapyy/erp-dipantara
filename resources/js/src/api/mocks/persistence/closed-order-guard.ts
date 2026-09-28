import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
export async function assertOpenPurchaseOrder(
    transaction: DemoTransaction,
    purchaseOrderId: string,
): Promise<void> {
    const purchaseOrder = await transaction.get('purchase-orders', purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    if (purchaseOrder.status === 'closed') throw new ApiError('conflict')
}
export async function orderPurchaseOrderId(
    transaction: DemoTransaction,
    orderId: string,
): Promise<string> {
    const order = await transaction.get('orders', orderId)
    if (!order) throw new ApiError('not-found')
    return order.purchaseOrderId
}
export async function preserveClosedRead<T extends { readonly allowedActions: readonly string[] }>(
    transaction: DemoTransaction,
    record: T,
    purchaseOrderId: string,
): Promise<T> {
    const purchaseOrder = await transaction.get('purchase-orders', purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    return purchaseOrder.status === 'closed' ? { ...record, allowedActions: [] } : record
}
