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
        else if (input[field].length > (field === 'notes' ? 2000 : 255))
            errors[field] = 'orders.invalid'
    }
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.orderDate) ||
        !Number.isFinite(Date.parse(input.orderDate)) ||
        new Date(input.orderDate).toISOString().slice(0, 10) !== input.orderDate
    )
        errors.orderDate = 'orders.invalid'
    return errors
}
