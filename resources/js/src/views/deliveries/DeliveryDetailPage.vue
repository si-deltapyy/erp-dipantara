<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import AppTable from '@/components/ui/AppTable.vue'

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnDelivery } from '@/core/domain/delivery-policy'
import { useDeliveryDetail } from './composables/useDeliveryDetail'
import DeliveryDocuments from './components/DeliveryDocuments.vue'
import DeliveryTransitions from './components/DeliveryTransitions.vue'
import type { DeliveryContext } from '@/core/types/delivery'
import type { TableColumn } from '@/core/types/table'
const { t } = useI18n()
const locked = ref(false)
const session = useSessionStore()
const { delivery, loading, error, refresh } = useDeliveryDetail()
const canEdit = computed(
    () => !!delivery.value && canActOnDelivery(session.user, delivery.value, 'update'),
)
const allocationColumns = computed<readonly TableColumn<DeliveryContext>[]>(() => [
    { key: 'timberProductName', label: t('deliveries.timber') },
    { key: 'mitraName', label: t('deliveries.mitra') },
    { key: 'quantity', label: t('deliveries.quantity') },
])
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('deliveries.detail')"
            ><template #actions>
                <RouterLink :to="{ name: 'deliveries' }" class="secondary-button">{{
                    t('deliveries.back')
                }}</RouterLink>
            </template></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" :message="t('deliveries.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="delivery">
            <AppPanel :title="t('deliveries.shipmentContext')" class="space-y-5 break-words">
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.number') }}</dt>
                        <dd class="font-semibold">{{ delivery.purchaseOrderNumber }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.buyer') }}</dt>
                        <dd>{{ delivery.buyerName }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.licensePlate') }}</dt>
                        <dd>{{ delivery.licensePlate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.deliveryDate') }}</dt>
                        <dd>{{ delivery.deliveryDate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.status') }}</dt>
                        <dd>
                            <AppStatusBadge
                                :tone="
                                    delivery.status === 'received'
                                        ? 'success'
                                        : delivery.status === 'dispatched'
                                          ? 'info'
                                          : 'neutral'
                                "
                                >{{ t('deliveries.statuses.' + delivery.status) }}</AppStatusBadge
                            >
                        </dd>
                    </div>
                </dl>
                <RouterLink
                    v-if="canEdit && !locked"
                    :to="{ name: 'delivery-edit', params: { id: delivery.id } }"
                    class="primary-button"
                    >{{ t('deliveries.edit') }}</RouterLink
                >
            </AppPanel>
            <AppPanel :title="t('deliveries.allocation')" class="min-w-0">
                <AppTable
                    :rows="delivery.allocationContext"
                    :columns="allocationColumns"
                    :row-key="(row) => row.gradingId + ':' + row.rowId"
                    :caption="t('deliveries.allocation')"
                >
                    <template #cell-timberProductName="{ row }"
                        ><span class="block max-w-64 whitespace-normal break-words">{{
                            row.timberProductName
                        }}</span></template
                    >
                    <template #cell-mitraName="{ row }"
                        ><span class="block max-w-64 whitespace-normal break-words">{{
                            row.mitraName
                        }}</span></template
                    >
                </AppTable>
            </AppPanel>
            <DeliveryDocuments :delivery="delivery" :locked="locked" />
            <DeliveryTransitions
                :delivery="delivery"
                @changed="delivery = $event"
                @locked="locked = $event"
            />
        </template>
    </section>
</template>
