import type { Ref } from 'vue'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { usePurchaseOrderRecoveryStore } from '@/stores/purchase-order-recovery'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { purchaseOrderDraft } from '@/core/domain/purchase-order-draft'
import { usePurchaseOrderApi } from './usePurchaseOrderApi'
export function usePurchaseOrderSubmit(
    order: Ref<PurchaseOrder | undefined>,
): ReturnType<typeof useRecordSubmit<PurchaseOrder>> {
    const recovery = usePurchaseOrderRecoveryStore()
    return useRecordSubmit(order, {
        resource: 'purchase-orders',
        api: usePurchaseOrderApi(),
        canAct: canActOnPurchaseOrder,
        snapshot: () => {
            const snapshot = recovery.snapshot
            return snapshot?.action === 'submit' && snapshot.order
                ? {
                      actorId: snapshot.actorId,
                      record: snapshot.order,
                      idempotencyKey: snapshot.idempotencyKey,
                  }
                : null
        },
        recover: (record, key, actorId) => {
            recovery.snapshot = {
                actorId,
                order: record,
                draft: purchaseOrderDraft(record),
                idempotencyKey: key,
                action: 'submit',
            }
        },
        clear: () => recovery.$reset(),
    })
}
