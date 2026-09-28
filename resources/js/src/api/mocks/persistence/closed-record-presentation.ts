import type { DemoTransaction } from './transaction'
import type { SessionUser } from '@/core/types/session'
import type { Invoice } from '@/core/types/invoice'
import type { Assignment } from '@/core/types/assignment'
import type { Grading } from '@/core/types/grading'
import { presentInvoice } from './invoice-policy'
import { presentAssignment } from '../assignment-policy'
import { presentGrading } from '../grading-policy'
import { preserveClosedRead, orderPurchaseOrderId } from './closed-order-guard'
export function presentStoredInvoice(
    transaction: DemoTransaction,
    invoice: Invoice,
    actor: SessionUser,
    generation: string,
): Promise<Invoice> {
    return preserveClosedRead(
        transaction,
        presentInvoice(invoice, actor, generation),
        invoice.purchaseOrderId,
    )
}
export async function presentStoredAssignment(
    transaction: DemoTransaction,
    assignment: Assignment,
    actor: SessionUser,
    generation: string,
): Promise<Assignment> {
    return preserveClosedRead(
        transaction,
        presentAssignment(assignment, actor, generation),
        await orderPurchaseOrderId(transaction, assignment.orderId),
    )
}
export async function presentStoredGrading(
    transaction: DemoTransaction,
    grading: Grading,
    assignment: Assignment,
    actor: SessionUser,
    generation: string,
): Promise<Grading> {
    return preserveClosedRead(
        transaction,
        presentGrading(grading, assignment, actor, generation),
        await orderPurchaseOrderId(transaction, assignment.orderId),
    )
}
