import { isCalendarDate, isRecordId, isPhoneNumber } from './input-validation'
import type { OrderInput, OrderCreateInput } from '@/core/types/order'
export function orderDraft(order?: OrderInput): OrderInput {
    return { purchaseOrderId: order?.purchaseOrderId ?? '', notes: order?.notes ?? null }
}
export function validateOrder(input: OrderInput): Partial<Record<keyof OrderInput, string>> {
    return {
        ...(!input.purchaseOrderId ? { purchaseOrderId: 'orders.required' } : {}),
        ...(input.notes && [...input.notes].length > 2000 ? { notes: 'orders.invalid' } : {}),
    }
}

export function emptyOrderCreate(): OrderCreateInput {
    return {
        purchaseOrderId: '',
        number: '',
        orderDate: '',
        mitraId: '',
        graderId: '',
        buyerGraderName: '',
        buyerGraderPhone: '',
        notes: '',
    }
}
export function validateOrderCreate(
    input: OrderCreateInput,
): Partial<Record<keyof OrderCreateInput, string>> {
    const errors: Partial<Record<keyof OrderCreateInput, string>> = {}
    for (const field of Object.keys(input) as (keyof OrderCreateInput)[]) {
        if (field !== 'notes' && !input[field].trim()) errors[field] = 'orders.required'
        else if (input[field].length > 255) errors[field] = 'ui.validation.textLength'
    }
    if (!isCalendarDate(input.orderDate)) errors.orderDate = 'ui.validation.date'
    for (const field of ['purchaseOrderId', 'mitraId', 'graderId'] as const)
        if (input[field] && !isRecordId(input[field])) errors[field] = 'ui.validation.selection'
    if (input.buyerGraderPhone.length > 40) errors.buyerGraderPhone = 'ui.validation.phoneLength'
    else if (input.buyerGraderPhone.trim() && !isPhoneNumber(input.buyerGraderPhone))
        errors.buyerGraderPhone = 'ui.validation.phone'
    return errors
}
