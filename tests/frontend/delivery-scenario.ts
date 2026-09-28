import { createApprovedGradingScenario } from './grading-scenario'
import { DeliveryRepository } from '../../resources/js/src/api/mocks/persistence/delivery-repository'
import { DocumentRepository } from '../../resources/js/src/api/mocks/persistence/document-repository'
import type { DeliveryDocument } from '../../resources/js/src/core/types/delivery'
export async function createDeliveryScenario(
    databaseName?: string,
): Promise<Awaited<ReturnType<typeof buildDeliveryScenario>>> {
    return buildDeliveryScenario(databaseName)
}
async function buildDeliveryScenario(databaseName?: string) {
    const scenario = await createApprovedGradingScenario(databaseName)
    const { options, maker, signal, generation, approved } = scenario
    const deliveries = new DeliveryRepository(options)
    const documents = new DocumentRepository(options)
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: 'createdAt' as const,
        purchaseOrderId: 'demo-po-03',
    }
    const snapshot = await deliveries.availability(maker, query, signal)
    const input = {
        purchaseOrderId: 'demo-po-03',
        deliveryDate: '2026-09-28',
        licensePlate: 'DEMO SAKR',
        allocations: [{ gradingId: approved.id, rowId: 'stable-row', quantity: 2 }],
        documents: [],
        availabilityToken: snapshot.data[0]?.snapshotToken ?? '',
    }
    const delivery = await deliveries.mutate(
        maker,
        { action: 'create', input, key: 'delivery' },
        generation,
        signal,
    )
    async function attachDocuments() {
        const references: DeliveryDocument[] = []
        for (const direction of ['farmer_to_company', 'company_to_buyer'] as const) {
            const file = new File(['%PDF-1.4\nSynthetic SAKR'], `${direction}.pdf`, {
                type: 'application/pdf',
            })
            const document = await documents.upload(
                maker,
                { parentType: 'delivery', parentId: delivery.id, purpose: 'sakr', file },
                direction,
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
        const stock = await deliveries.availability(
            maker,
            { ...query, excludeDeliveryId: delivery.id },
            signal,
        )
        return deliveries.mutate(
            maker,
            {
                action: 'update',
                id: delivery.id,
                input: {
                    ...input,
                    documents: references,
                    version: delivery.version,
                    availabilityToken: stock.data[0]?.snapshotToken ?? '',
                },
                key: 'attach-sakr',
            },
            generation,
            signal,
        )
    }
    return { ...scenario, deliveries, documents, delivery, input, query, attachDocuments }
}
