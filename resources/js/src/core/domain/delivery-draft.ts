import type { Delivery, DeliveryInput } from '@/core/types/delivery'
export function deliveryDraft(delivery?: Delivery): DeliveryInput {
    return {
        purchaseOrderId: delivery?.purchaseOrderId ?? '',
        deliveryDate:
            delivery?.deliveryDate ??
            new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        licensePlate: delivery?.licensePlate ?? '',
        allocations: delivery?.allocations.map((row) => ({ ...row })) ?? [],
        documents: delivery?.documents.map((document) => ({ ...document })) ?? [],
        availabilityToken: '',
    }
}
export function validateDelivery(
    input: DeliveryInput,
): Partial<Record<keyof DeliveryInput, string>> {
    return {
        ...(!input.purchaseOrderId ? { purchaseOrderId: 'deliveries.required' } : {}),
        ...(!input.deliveryDate ? { deliveryDate: 'deliveries.required' } : {}),
        ...(!input.licensePlate.trim() || input.licensePlate.length > 20
            ? { licensePlate: 'deliveries.required' }
            : {}),
        ...(!input.allocations.length ||
        input.allocations.some((row) => !Number.isSafeInteger(row.quantity) || row.quantity < 1)
            ? { allocations: 'deliveries.invalidAllocation' }
            : {}),
        ...(!input.availabilityToken ? { availabilityToken: 'deliveries.staleStock' } : {}),
    }
}
