import { integrationPermissions } from '@/core/constants/business-permissions'
import { useRecordDetail } from '@/composables/useRecordDetail'
import type { PurchaseOrderDetail } from '@/core/types/purchase-order'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'
export function usePurchaseOrderDetail(): Omit<
    ReturnType<typeof useRecordDetail<PurchaseOrderDetail>>,
    'record'
> & { order: ReturnType<typeof useRecordDetail<PurchaseOrderDetail>>['record'] } {
    const { record: order, ...state } = useRecordDetail(
        usePurchaseOrderApi(),
        'purchase-orders',
        true,
        undefined,
        integrationPermissions['purchase-orders.read'],
    )
    return { ...state, order }
}
