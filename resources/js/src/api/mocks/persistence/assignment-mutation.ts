import { assertOpenPurchaseOrder, orderPurchaseOrderId } from './closed-order-guard'
import type { Assignment, AssignmentInput } from '@/core/types/assignment'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { assertRecordAccess } from '@/core/domain/record-policy'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { resolveAssignmentLabels } from './assignment-labels'
import { assertAssignmentCapacity } from './assignment-capacity'
export interface AssignmentMutation {
    readonly action: 'create' | 'update'
    readonly id?: string
    readonly input: AssignmentInput & { readonly version?: number }
    readonly key: string
    readonly hash: string
}
export async function writeAssignment(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: AssignmentMutation,
): Promise<Assignment> {
    const previous = mutation.id ? await transaction.get('assignments', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous) assertRecordAccess(actor, 'assignments.update', previous)
    const order = await transaction.get('orders', mutation.input.orderId)
    if (!order) throw new ApiError('validation', { orderId: ['assignments.invalid'] })
    assertRecordAccess(actor, 'orders.update', order)
    await assertOpenPurchaseOrder(transaction, order.purchaseOrderId)
    if (previous)
        await assertOpenPurchaseOrder(
            transaction,
            await orderPurchaseOrderId(transaction, previous.orderId),
        )
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('assignmentMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return resolveAssignmentLabels(transaction, receipt.result)
    }
    if (!['draft', 'rejected'].includes(order.status)) throw new ApiError('conflict')
    if (previous && (previous.version !== mutation.input.version || previous.orderId !== order.id))
        throw new ApiError('conflict')
    const grader = await transaction.get('graders', mutation.input.graderId)
    if (!grader || grader.provisioningStatus !== 'active' || !grader.userId)
        throw new ApiError('validation', { graderId: ['assignments.inactiveGrader'] })
    if (!(await transaction.get('mitras', mutation.input.mitraId)))
        throw new ApiError('validation', { mitraId: ['assignments.invalid'] })
    await assertAssignmentCapacity(transaction, order, mutation.input, previous?.id)
    const now = new Date().toISOString()
    const assignment = await resolveAssignmentLabels(transaction, {
        orderId: order.id,
        mitraId: mutation.input.mitraId,
        graderId: grader.id,
        timberProductId: mutation.input.timberProductId,
        quantity: mutation.input.quantity,
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: null,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        allowedActions: [],
        graderUserId: grader.userId,
        orderStatus: order.status,
        purchaseOrderNumber: '',
        mitraName: '',
        graderName: '',
        timberProductName: '',
        gradingReference: { timberProductId: '', timberProductName: '', gradeCodes: [] },
    })
    assertRecordAccess(actor, `assignments.${mutation.action}`, assignment)
    await transaction.put('assignments', assignment)
    await transaction.put('orders', { ...order, version: order.version + 1, updatedAt: now })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'assignments',
        recordId: assignment.id,
        actorId: actor.id,
        version: assignment.version,
        action: mutation.action,
    })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'orders',
        recordId: order.id,
        actorId: actor.id,
        version: order.version + 1,
        action: 'allocate',
    })
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('assignmentMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: assignment,
    })
    return assignment
}
