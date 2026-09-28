import {
    createSettlementScenario,
    issueSettlementInvoice,
    submitSettlementPayment,
} from './settlement-scenario'
import { ClosingRepository } from '../../resources/js/src/api/mocks/persistence/closing-repository'
import { evaluateClosingQuantities } from '../../resources/js/src/core/domain/closing-quantities'
export async function createClosingScenario(
    name = 'woodflow-demo',
): Promise<Awaited<ReturnType<typeof buildClosingScenario>>> {
    return buildClosingScenario(name)
}
async function buildClosingScenario(name: string) {
    const context = await createSettlementScenario(name)
    const closings = new ClosingRepository(context.options)
    const { admin, maker, supervisor, owner, grader, po, generation, signal } = context
    const initial = await closings.eligibility(admin, po.id, signal)
    const invoice = await issueSettlementInvoice(context, 'receivable', 'settlement', '1700000.00')
    const unpaid = await closings.eligibility(admin, po.id, signal)
    const payment = await submitSettlementPayment(context, invoice, '1700000.00')
    const pending = await closings.eligibility(admin, po.id, signal)
    await context.payments.mutate(
        supervisor,
        {
            action: 'approve',
            id: payment.id,
            input: { version: payment.version },
            key: 'closing-buyer-payment',
        },
        generation,
        signal,
    )
    const payable = await issueSettlementInvoice(context, 'payable', 'settlement', '100000.00')
    const outgoing = await submitSettlementPayment(context, payable, '100000.00')
    await context.payments.mutate(
        supervisor,
        {
            action: 'approve',
            id: outgoing.id,
            input: { version: outgoing.version },
            key: 'closing-mitra-payment',
        },
        generation,
        signal,
    )
    const eligible = await closings.eligibility(admin, po.id, signal)
    const makerView = await closings.eligibility(maker, po.id, signal)
    const onlyClosing = await closings.eligibility(
        { ...admin, permissions: ['closings.read.all'] },
        po.id,
        signal,
    )
    const failures: string[] = []
    for (const actor of [owner, grader]) {
        try {
            await closings.eligibility(actor, po.id, signal)
        } catch (cause) {
            failures.push((cause as { kind: string }).kind)
        }
    }
    const snapshot = {
        purchaseOrder: po,
        assignments: [context.assignment],
        gradings: [context.approved],
        deliveries: context.shipments,
    }
    const wrongProduct = evaluateClosingQuantities({
        ...snapshot,
        assignments: [{ ...context.assignment, timberProductId: 'other-product' }],
    })
    const wrongAssignment = evaluateClosingQuantities({
        ...snapshot,
        assignments: [{ ...context.assignment, id: 'other-assignment' }],
    })
    const noShipment = evaluateClosingQuantities({ ...snapshot, deliveries: [] })
    return {
        context,
        closings,
        initial,
        unpaid,
        pending,
        eligible,
        makerView,
        onlyClosing,
        failures,
        wrongProduct,
        wrongAssignment,
        noShipment,
    }
}
