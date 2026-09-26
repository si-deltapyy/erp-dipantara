import type { PurchaseOrderLineInput } from '@/core/types/purchase-order'

export function calculatePurchaseOrderTotal(lines: readonly PurchaseOrderLineInput[]): string {
    const cents = lines.reduce(
        (sum, line) => sum + BigInt(line.unitPrice.replace('.', '')) * BigInt(line.quantity),
        0n,
    )
    const digits = (cents < 0n ? -cents : cents).toString().padStart(3, '0')
    return `${cents < 0n ? '-' : ''}${digits.slice(0, -2)}.${digits.slice(-2)}`
}
