import type { Assignment } from '@/core/types/assignment'
import type { Delivery } from '@/core/types/delivery'
import type { Grading } from '@/core/types/grading'
import type { Invoice } from '@/core/types/invoice'
import type { Order } from '@/core/types/order'
import type { Payment } from '@/core/types/payment'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { DemoTransaction } from './transaction'
import { normalizeIssuedInvoice } from './invoice-settlement'
export interface ClosingSnapshot {
    readonly purchaseOrder: PurchaseOrder
    readonly orders: readonly Order[]
    readonly assignments: readonly Assignment[]
    readonly gradings: readonly Grading[]
    readonly deliveries: readonly Delivery[]
    readonly invoices: readonly Invoice[]
    readonly payments: readonly Payment[]
}
export async function loadClosingSnapshot(
    transaction: DemoTransaction,
    purchaseOrder: PurchaseOrder,
): Promise<ClosingSnapshot> {
    const orders = (await transaction.list('orders')).filter(
        (order) => order.purchaseOrderId === purchaseOrder.id,
    )
    const orderIds = new Set(orders.map((order) => order.id))
    const assignments = (await transaction.list('assignments')).filter((assignment) =>
        orderIds.has(assignment.orderId),
    )
    const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
    return {
        purchaseOrder,
        orders,
        assignments,
        gradings: (await transaction.list('gradings')).filter((grading) =>
            assignmentIds.has(grading.assignmentId),
        ),
        deliveries: (await transaction.list('deliveries')).filter(
            (delivery) => delivery.purchaseOrderId === purchaseOrder.id,
        ),
        invoices: (await transaction.list('invoices'))
            .filter((invoice) => invoice.purchaseOrderId === purchaseOrder.id)
            .map(normalizeIssuedInvoice),
        payments: (await transaction.list('payments')).filter(
            (payment) => payment.purchaseOrderId === purchaseOrder.id,
        ),
    }
}
