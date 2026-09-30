import type { Ref } from 'vue'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { ReviewSnapshot } from '@/core/types/workflow'
import { useRecordReview } from '@/composables/useRecordReview'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'
export function usePurchaseOrderReview(
    order: Ref<PurchaseOrder | undefined>,
    refresh: () => Promise<void>,
    orderId: () => unknown,
): ReturnType<typeof useRecordReview<PurchaseOrder>> {
    const recovery = usePurchaseOrderRecoveryStore()
    return useRecordReview(order, refresh, orderId, {
        resource: 'purchase-orders',
        api: usePurchaseOrderApi(),
        canAct: canActOnPurchaseOrder,
        recovery: {
            get review(): ReviewSnapshot<PurchaseOrder> | null {
                const snapshot = recovery.review
                return snapshot
                    ? {
                          actorId: snapshot.actorId,
                          record: snapshot.order,
                          action: snapshot.action,
                          reason: snapshot.reason,
                          idempotencyKey: snapshot.idempotencyKey,
                      }
                    : null
            },
            set review(snapshot: ReviewSnapshot<PurchaseOrder> | null) {
                recovery.review = snapshot
                    ? {
                          actorId: snapshot.actorId,
                          order: snapshot.record,
                          action: snapshot.action,
                          reason: snapshot.reason,
                          idempotencyKey: snapshot.idempotencyKey,
                      }
                    : null
            },
        },
    })
}
