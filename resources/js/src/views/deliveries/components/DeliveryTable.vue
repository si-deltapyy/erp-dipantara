<script setup lang="ts">
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Delivery } from '@/core/types/delivery'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{ deliveries: readonly Delivery[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Delivery>[]>(() => [
    { key: 'buyerName', label: t('deliveries.buyer') },
    { key: 'purchaseOrderNumber', label: t('deliveries.number') },
    { key: 'licensePlate', label: t('deliveries.licensePlate') },
    { key: 'deliveryDate', label: t('deliveries.deliveryDate') },
    { key: 'status', label: t('deliveries.status') },
    { key: 'allowedActions', label: t('deliveries.actions') },
])
</script>
<template>
    <AppTable
        :rows="deliveries"
        :columns="columns"
        :row-key="(delivery) => delivery.id"
        :caption="t('deliveries.title')"
    >
        <template #cell-buyerName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.buyerName
            }}</span></template
        >
        <template #cell-status="{ row }"
            ><AppStatusBadge
                :tone="
                    row.status === 'received'
                        ? 'success'
                        : row.status === 'dispatched'
                          ? 'info'
                          : 'neutral'
                "
                >{{ t('deliveries.statuses.' + row.status) }}</AppStatusBadge
            ></template
        >
        <template #cell-allowedActions="{ row }"
            ><RouterLink
                :to="{ name: 'delivery-detail', params: { id: row.id } }"
                class="secondary-button"
                :aria-label="t('deliveries.open', { number: row.purchaseOrderNumber })"
                >{{ t('deliveries.detail') }}</RouterLink
            ></template
        >
    </AppTable>
</template>
