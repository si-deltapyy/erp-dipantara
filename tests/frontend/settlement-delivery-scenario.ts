import type { Delivery, DeliveryDocument } from '../../resources/js/src/core/types/delivery'
import type { createApprovedGradingScenario } from './grading-scenario'
import { DeliveryRepository } from '../../resources/js/src/api/mocks/persistence/delivery-repository'
import { DocumentRepository } from '../../resources/js/src/api/mocks/persistence/document-repository'
export async function receiveSettlementAllocation(
    context: Awaited<ReturnType<typeof createApprovedGradingScenario>>,
    purchaseOrderId: string,
    quantity: number,
): Promise<Delivery> {
    const { options, maker, signal, generation, approved } = context
    const deliveries = new DeliveryRepository(options)
    const documents = new DocumentRepository(options)
    const key = crypto.randomUUID()
    const query = { page: 1, perPage: 20, search: '', sort: 'createdAt' as const, purchaseOrderId }
    const stock = await deliveries.availability(maker, query, signal)
    const input = {
        purchaseOrderId,
        deliveryDate: '2026-09-28',
        licensePlate: 'DEMO CHAIN',
        allocations: [{ gradingId: approved.id, rowId: 'stable-row', quantity }],
        documents: [],
        availabilityToken: stock.data[0]?.snapshotToken ?? '',
    }
    const draft = await deliveries.mutate(
        maker,
        { action: 'create', input, key },
        generation,
        signal,
    )
    const references: DeliveryDocument[] = []
    for (const direction of ['farmer_to_company', 'company_to_buyer'] as const) {
        const document = await documents.upload(
            maker,
            {
                parentType: 'delivery',
                parentId: draft.id,
                purpose: 'sakr',
                file: new File(['%PDF-1.4\nDemo SAKR\n%%EOF'], direction + '.pdf', {
                    type: 'application/pdf',
                }),
            },
            key + direction,
            generation,
            signal,
        )
        references.push({
            documentId: document.id,
            direction,
            number: 'DEMO-' + direction,
            documentDate: '2026-09-28',
        })
    }
    const current = await deliveries.availability(
        maker,
        { ...query, excludeDeliveryId: draft.id },
        signal,
    )
    const ready = await deliveries.mutate(
        maker,
        {
            action: 'update',
            id: draft.id,
            input: {
                ...input,
                documents: references,
                version: draft.version,
                availabilityToken: current.data[0]?.snapshotToken ?? '',
            },
            key,
        },
        generation,
        signal,
    )
    const dispatched = await deliveries.mutate(
        maker,
        { action: 'dispatch', id: draft.id, input: { version: ready.version }, key },
        generation,
        signal,
    )
    return deliveries.mutate(
        maker,
        { action: 'receive', id: draft.id, input: { version: dispatched.version }, key },
        generation,
        signal,
    )
}
