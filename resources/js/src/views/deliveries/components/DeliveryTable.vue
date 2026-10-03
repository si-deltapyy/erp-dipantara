<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DeliveryRecord } from '@/core/types/delivery'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ deliveries: readonly DeliveryRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<DeliveryRecord>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('deliveries.number') },
    { key: 'mitraName', label: t('deliveries.mitra') },
    { key: 'licensePlate', label: t('deliveries.licensePlate') },
    { key: 'deliveryDate', label: t('deliveries.deliveryDate') },
    { key: 'status', label: t('deliveries.status') },
    { key: 'companySakrNumber', label: t('deliveries.companySakr') },
    { key: 'buyerSakrNumber', label: t('deliveries.buyerSakr') },
])
const tones = {
    pending: 'warning',
    delivered: 'success',
    cancelled: 'danger',
    returned: 'warning',
    in_transit: 'info',
    on_the_way: 'info',
} as const
</script>
<template>
    <AppTable
        :rows="deliveries"
        :columns="columns"
        :row-key="(delivery) => delivery.id"
        :caption="t('deliveries.title')"
    >
        <template
            v-for="field in ['purchaseOrderNumber', 'mitraName'] as const"
            #[`cell-${field}`]="{ row }"
        >
            {{ row[field] ?? t('ui.unavailableValue') }}
        </template>
        <template #cell-status="{ row }"
            ><AppStatusBadge :tone="tones[row.status]">{{
                t('deliveries.statuses.' + row.status)
            }}</AppStatusBadge></template
        >
    </AppTable>
</template>
