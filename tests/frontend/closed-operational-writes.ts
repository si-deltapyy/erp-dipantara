import { PurchaseOrderRepository } from '../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import { DeliveryRepository } from '../../resources/js/src/api/mocks/persistence/delivery-repository'
import type { prepareClosedOrder } from './closed-order-scenario'
type Setup = Awaited<ReturnType<typeof prepareClosedOrder>>
export function operationalClosedWrites(setup: Setup): [string, () => Promise<unknown>][] {
    const { context } = setup
    const {
        po,
        owner,
        maker,
        grader,
        admin,
        signal,
        generation,
        assignment,
        approved,
        shipments,
        options,
    } = context
    const purchaseOrders = new PurchaseOrderRepository(options)
    const deliveries = new DeliveryRepository(options)
    const shipment = shipments[0]
    if (!shipment) throw new Error('Missing shipment')
    const gradingInput = {
        assignmentId: assignment.id,
        gradingDate: approved.gradingDate,
        rows: approved.rows,
    }
    const assignmentInput = {
        orderId: assignment.orderId,
        mitraId: assignment.mitraId,
        graderId: assignment.graderId,
        timberProductId: assignment.timberProductId,
        quantity: assignment.quantity,
    }
    const deliveryInput = {
        purchaseOrderId: po.id,
        deliveryDate: shipment.deliveryDate,
        licensePlate: shipment.licensePlate,
        allocations: shipment.allocations,
        documents: shipment.documents,
        availabilityToken: 'stale-token',
    }
    const writes: [string, () => Promise<unknown>][] = [
        [
            'po-update',
            () =>
                purchaseOrders.mutate(
                    owner,
                    {
                        action: 'update',
                        id: po.id,
                        input: {
                            buyerId: po.buyerId,
                            number: po.number,
                            orderDate: po.orderDate,
                            notes: null,
                            lines: po.lines.map(({ timberProductId, quantity, unitPrice }) => ({
                                timberProductId,
                                quantity,
                                unitPrice,
                            })),
                            version: po.version,
                        },
                        key: 'closed-po',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'order-create',
            () =>
                context.orders.mutate(
                    maker,
                    {
                        action: 'create',
                        input: { purchaseOrderId: po.id, notes: null },
                        key: 'closed-order',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'order-update',
            () =>
                context.orders.mutate(
                    maker,
                    {
                        action: 'update',
                        id: context.order.id,
                        input: {
                            purchaseOrderId: po.id,
                            notes: null,
                            version: context.order.version,
                        },
                        key: 'closed-order-update',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'assignment-create',
            () =>
                context.assignments.mutate(
                    maker,
                    { action: 'create', input: assignmentInput, key: 'closed-assignment' },
                    generation,
                    signal,
                ),
        ],
        [
            'assignment-update',
            () =>
                context.assignments.mutate(
                    maker,
                    {
                        action: 'update',
                        id: assignment.id,
                        input: { ...assignmentInput, version: assignment.version },
                        key: 'closed-assignment-update',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'grading-create',
            () =>
                context.gradings.mutate(
                    grader,
                    { action: 'create', input: gradingInput, key: 'closed-grade-create' },
                    generation,
                    signal,
                ),
        ],
        [
            'grading-update',
            () =>
                context.gradings.mutate(
                    grader,
                    {
                        action: 'update',
                        id: approved.id,
                        input: { ...gradingInput, version: approved.version },
                        key: 'closed-grade-update',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'grading-revise',
            () =>
                context.gradings.mutate(
                    grader,
                    {
                        action: 'revise',
                        id: approved.id,
                        input: {
                            version: approved.version,
                            gradingDate: approved.gradingDate,
                            rows: approved.rows,
                            reason: 'Late change',
                        },
                        key: 'closed-grading',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'delivery-create',
            () =>
                deliveries.mutate(
                    admin,
                    { action: 'create', input: deliveryInput, key: 'closed-delivery' },
                    generation,
                    signal,
                ),
        ],
        [
            'delivery-update',
            () =>
                deliveries.mutate(
                    admin,
                    {
                        action: 'update',
                        id: shipment.id,
                        input: { ...deliveryInput, version: shipment.version },
                        key: 'closed-delivery-update',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'po-document',
            () =>
                context.documents.upload(
                    owner,
                    {
                        parentType: 'purchase-order',
                        parentId: po.id,
                        purpose: 'approved_po',
                        file: new File(['%PDF-1.4\nClosed\n%%EOF'], 'closed.pdf', {
                            type: 'application/pdf',
                        }),
                    },
                    'closed-upload',
                    generation,
                    signal,
                ),
        ],
    ]
    return writes
}
