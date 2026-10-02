import type { PurchaseOrderInput } from '@/core/types/purchase-order'

export function purchaseOrderDraft(order?: PurchaseOrderInput): PurchaseOrderInput {
    if (order)
        return {
            buyerId: order.buyerId,
            number: order.number,
            orderDate: order.orderDate,
            notes: order.notes,
            lines: order.lines.map(({ timberProductId, quantity, unitPrice }) => ({
                timberProductId,
                quantity,
                unitPrice,
            })),
        }
    return {
        buyerId: '',
        number: '',
        orderDate: '',
        notes: null,
        lines: [{ timberProductId: '', quantity: 1, unitPrice: '' }],
    }
}
export function validatePurchaseOrder(input: PurchaseOrderInput): Record<string, string> {
    const errors: Record<string, string> = {}
    const invalid = 'purchase-orders.invalid'
    if (!input.buyerId) errors.buyerId = invalid
    if (!input.number.trim() || [...input.number].length > 255) errors.number = invalid
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.orderDate) ||
        !Number.isFinite(Date.parse(input.orderDate)) ||
        new Date(input.orderDate).toISOString().slice(0, 10) !== input.orderDate
    )
        errors.orderDate = invalid
    if (input.notes && [...input.notes].length > 2000) errors.notes = invalid
    if (!input.lines.length) errors.lines = invalid
    input.lines.forEach((line, index) => {
        if (!line.timberProductId) errors[`lines.${index}.timberProductId`] = invalid
        if (!Number.isSafeInteger(line.quantity) || line.quantity < 1)
            errors[`lines.${index}.quantity`] = invalid
        if (!/^-?\d+\.\d{2}$/.test(line.unitPrice)) errors[`lines.${index}.unitPrice`] = invalid
    })
    return errors
}
