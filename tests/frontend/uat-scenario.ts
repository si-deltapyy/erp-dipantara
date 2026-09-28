import { createApprovedGradingScenario } from './grading-scenario'
import { receiveSettlementAllocation } from './settlement-delivery-scenario'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { PurchaseOrderRepository } from '../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
import type { PurchaseOrder } from '../../resources/js/src/core/types/purchase-order'
import type { SessionUser } from '../../resources/js/src/core/types/session'
export interface UatOrderInput {
    readonly ownerId: string
    readonly number: string
    readonly quantity: number
    readonly graderNumber: 1 | 2
    readonly shipments: readonly number[]
}
export interface UatOrder {
    readonly purchaseOrderId: string
    readonly purchaseOrderNumber: string
    readonly orderId: string
    readonly assignmentId: string
    readonly gradingId: string
    readonly deliveryIds: readonly string[]
}
const options = { name: 'woodflow-demo' }
function actor(id: string): SessionUser {
    const found = sessionFixtures.find((user) => user.id === id)
    if (!found) throw new Error('Missing actor ' + id)
    return found
}
async function approvePurchaseOrder(
    input: UatOrderInput,
    generation: string,
    signal: AbortSignal,
): Promise<PurchaseOrder> {
    const owner = actor(input.ownerId)
    const repository = new PurchaseOrderRepository(options)
    const draft = await repository.mutate(
        owner,
        {
            action: 'create',
            input: {
                buyerId: 'demo-buyer-01',
                number: input.number,
                orderDate: '2026-09-28',
                notes: null,
                lines: [
                    {
                        timberProductId: 'demo-timber-01',
                        quantity: input.quantity,
                        unitPrice: '3400.00',
                    },
                ],
            },
            key: 'create-' + input.number,
        },
        generation,
        signal,
    )
    const submitted = await repository.mutate(
        owner,
        { action: 'submit', id: draft.id, input: { version: draft.version }, key: 'submit' },
        generation,
        signal,
    )
    return repository.mutate(
        actor('supervisor-demo'),
        { action: 'approve', id: draft.id, input: { version: submitted.version }, key: 'approve' },
        generation,
        signal,
    )
}
export async function createUatOrder(input: UatOrderInput): Promise<UatOrder> {
    const { generation } = await new DemoRepository(options).initialize()
    const purchaseOrder = await approvePurchaseOrder(
        input,
        generation,
        new AbortController().signal,
    )
    const context = await createApprovedGradingScenario(
        options.name,
        purchaseOrder.id,
        input.quantity,
        input.graderNumber,
    )
    const deliveryIds: string[] = []
    for (const quantity of input.shipments)
        deliveryIds.push(
            (await receiveSettlementAllocation(context, purchaseOrder.id, quantity)).id,
        )
    return {
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderNumber: purchaseOrder.number,
        orderId: context.order.id,
        assignmentId: context.assignment.id,
        gradingId: context.approved.id,
        deliveryIds,
    }
}
