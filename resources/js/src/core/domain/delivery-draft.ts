import { isCalendarDate, isRecordId, isLicensePlate } from './input-validation'
import { deliveryRecordStatuses } from '@/core/types/delivery'
import type { Delivery, DeliveryInput, DeliveryCreateInput } from '@/core/types/delivery'
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
        ...(!isCalendarDate(input.deliveryDate) ? { deliveryDate: 'ui.validation.date' } : {}),
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

export function emptyDeliveryCreate(): DeliveryCreateInput {
    return {
        purchaseOrderId: '',
        mitraId: '',
        graderId: '',
        deliveryDate: '',
        licensePlate: '',
        buyerSakrNumber: '',
        companySakrNumber: '',
        status: 'pending',
        notes: '',
    }
}
export function validateDeliveryCreate(
    input: DeliveryCreateInput,
): Partial<Record<keyof DeliveryCreateInput, string>> {
    const errors: Partial<Record<keyof DeliveryCreateInput, string>> = {}
    for (const field of Object.keys(input) as (keyof DeliveryCreateInput)[]) {
        if (field !== 'notes' && !input[field].trim()) errors[field] = 'deliveries.required'
        else if (input[field].length > 255) errors[field] = 'ui.validation.textLength'
    }
    if (!isCalendarDate(input.deliveryDate)) errors.deliveryDate = 'ui.validation.date'
    if (!deliveryRecordStatuses.includes(input.status)) errors.status = 'deliveries.invalid'
    for (const field of ['purchaseOrderId', 'mitraId', 'graderId'] as const)
        if (input[field] && !isRecordId(input[field])) errors[field] = 'ui.validation.selection'
    if (input.licensePlate.trim() && !errors.licensePlate && !isLicensePlate(input.licensePlate))
        errors.licensePlate = 'ui.validation.plate'
    return errors
}
