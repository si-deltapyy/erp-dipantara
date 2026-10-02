import type { OrderInput } from '@/core/types/order'
export function orderDraft(order?: OrderInput): OrderInput {
    return { purchaseOrderId: order?.purchaseOrderId ?? '', notes: order?.notes ?? null }
}
export function validateOrder(input: OrderInput): Partial<Record<keyof OrderInput, string>> {
    return {
        ...(!input.purchaseOrderId ? { purchaseOrderId: 'orders.required' } : {}),
        ...(input.notes && [...input.notes].length > 2000 ? { notes: 'orders.invalid' } : {}),
    }
}
