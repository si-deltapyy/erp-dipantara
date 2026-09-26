import { parsePurchaseOrder } from '@/api/purchase-order-mapper'
import { purchaseOrderStatuses } from '@/core/types/purchase-order'
import type { PurchaseOrder } from '@/core/types/purchase-order'

export const purchaseOrderFixtures: readonly PurchaseOrder[] = Array.from(
    { length: 26 },
    (_, index) => {
        const number = String(index + 1).padStart(2, '0')
        const status = purchaseOrderStatuses[index % purchaseOrderStatuses.length] ?? 'draft'
        const owner = index === 25 ? 'multiple-demo' : 'user-demo'
        return parsePurchaseOrder({
            id: `demo-po-${number}`,
            buyerId: 'demo-buyer-01',
            buyerName: 'Perusahaan Simulasi 01',
            number: `DEMO-PO-${number}`,
            orderDate: `2026-08-${number}`,
            lines: [
                {
                    timberProductId: 'demo-timber-01',
                    timberProductName: 'Kayu Simulasi 01',
                    quantity: 2,
                    unitPrice: '150000.00',
                },
            ],
            notes: null,
            status,
            totalAmount: '300000.00',
            version: 1,
            createdAt: `2026-08-${number}T00:00:00Z`,
            updatedAt: `2026-08-${number}T00:00:00Z`,
            createdByUserId: owner,
            submittedByUserId: status === 'draft' ? null : owner,
            allowedActions: [],
        })
    },
)
