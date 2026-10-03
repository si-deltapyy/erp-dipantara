import { isCalendarDate, isRecordId, isNonnegativeInteger } from './input-validation'
import type {
    PurchaseOrderInput,
    PurchaseOrderWriteInput,
    PurchaseOrderDetail,
} from '@/core/types/purchase-order'

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
    if (!isCalendarDate(input.orderDate)) errors.orderDate = invalid
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

export function purchaseOrderWriteDraft(order?: PurchaseOrderDetail): PurchaseOrderWriteInput {
    return {
        buyerId: order?.buyerId ?? '',
        productId: order?.productId ?? '',
        number: order?.number ?? '',
        orderDate: order?.orderDate ?? '',
        closingDate: order?.closingDate ?? '',
        quantity: order ? String(order.quantity) : '',
        totalAmount: order?.totalAmount?.replace(/\.00$/, '') ?? '',
        notes: order?.notes ?? '',
    }
}
export function validatePurchaseOrderWrite(
    input: PurchaseOrderWriteInput,
): Partial<Record<keyof PurchaseOrderWriteInput, string>> {
    const errors: Partial<Record<keyof PurchaseOrderWriteInput, string>> = {}
    for (const field of [
        'buyerId',
        'productId',
        'number',
        'orderDate',
        'closingDate',
        'quantity',
    ] as const)
        if (!input[field].trim()) errors[field] = 'ui.validation.required'
    for (const field of ['orderDate', 'closingDate'] as const) {
        if (!isCalendarDate(input[field])) errors[field] = 'ui.validation.date'
    }
    if (!isNonnegativeInteger(input.quantity) || Number(input.quantity) < 1)
        errors.quantity = 'ui.validation.quantity'
    if (input.totalAmount.trim() && !isNonnegativeInteger(input.totalAmount.trim()))
        errors.totalAmount = 'ui.validation.integer'
    if (input.number.length > 255) errors.number = 'ui.validation.textLength'
    if ([...input.notes].length > 255) errors.notes = 'ui.validation.textLength'
    for (const field of ['buyerId', 'productId'] as const)
        if (input[field] && !isRecordId(input[field])) errors[field] = 'ui.validation.selection'
    return errors
}
