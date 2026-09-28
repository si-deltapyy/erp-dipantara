import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { OrderRepository } from '../../resources/js/src/api/mocks/persistence/order-repository'
import { AssignmentRepository } from '../../resources/js/src/api/mocks/persistence/assignment-repository'
import { GradingRepository } from '../../resources/js/src/api/mocks/persistence/grading-repository'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
import type { SessionUser } from '../../resources/js/src/core/types/session'
function actor(id: string): SessionUser {
    const found = sessionFixtures.find((user) => user.id === id)
    if (!found) throw new Error(id)
    return found
}
export async function createApprovedGradingScenario(
    databaseName?: string,
    purchaseOrderId = 'demo-po-03',
    quantity = 2,
    graderNumber: 1 | 2 = 1,
): Promise<Awaited<ReturnType<typeof buildScenario>>> {
    return buildScenario(databaseName, purchaseOrderId, quantity, graderNumber)
}
async function buildScenario(
    databaseName: string | undefined,
    purchaseOrderId: string,
    quantity: number,
    graderNumber: 1 | 2,
) {
    const options = { name: databaseName ?? 'grading-revision-test-' + crypto.randomUUID() }
    const metadata = await new DemoRepository(options).initialize()
    const signal = new AbortController().signal,
        generation = metadata.generation
    const maker = actor('maker-demo'),
        grader = actor(graderNumber === 1 ? 'grader-one' : 'grader-two'),
        supervisor = actor('supervisor-demo'),
        admin = actor('admin-demo')
    const orders = new OrderRepository(options),
        assignments = new AssignmentRepository(options),
        gradings = new GradingRepository(options)
    const order = await orders.mutate(
        maker,
        {
            action: 'create',
            input: { purchaseOrderId, notes: null },
            key: 'order-' + purchaseOrderId,
        },
        generation,
        signal,
    )
    const assignment = await assignments.mutate(
        maker,
        {
            action: 'create',
            input: {
                orderId: order.id,
                mitraId: 'demo-mitra-01',
                graderId: graderNumber === 1 ? 'demo-grader-01' : 'demo-grader-02',
                timberProductId: 'demo-timber-01',
                quantity,
            },
            key: 'assignment-' + purchaseOrderId,
        },
        generation,
        signal,
    )
    const ready = await orders.get(maker, order.id, signal)
    const submittedOrder = await orders.mutate(
        maker,
        { action: 'submit', id: ready.id, input: { version: ready.version }, key: 'submit-order' },
        generation,
        signal,
    )
    await orders.mutate(
        supervisor,
        {
            action: 'approve',
            id: ready.id,
            input: { version: submittedOrder.version },
            key: 'approve-order',
        },
        generation,
        signal,
    )
    const input = {
        assignmentId: assignment.id,
        gradingDate: '2026-09-27',
        rows: [
            {
                rowId: 'stable-row',
                timberProductId: 'demo-timber-01',
                quantity,
                diameterCm: '25',
                lengthM: '2',
                gradeCode: 'DEMO',
            },
        ],
    }
    const draft = await gradings.mutate(
        grader,
        { action: 'create', input, key: 'draft-' + purchaseOrderId },
        generation,
        signal,
    )
    const submitted = await gradings.mutate(
        grader,
        { action: 'submit', id: draft.id, input: { version: draft.version }, key: 'submit' },
        generation,
        signal,
    )
    const approved = await gradings.mutate(
        supervisor,
        { action: 'approve', id: draft.id, input: { version: submitted.version }, key: 'approve' },
        generation,
        signal,
    )
    return {
        options,
        signal,
        generation,
        maker,
        grader,
        supervisor,
        admin,
        orders,
        order: submittedOrder,
        assignments,
        gradings,
        assignment,
        approved,
        input,
    }
}
