<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BuyerRecord } from '@/core/types/buyer'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{
    buyers: readonly BuyerRecord[]
    state: 'ready' | 'loading' | 'error'
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<BuyerRecord>[]>(() => [
    { key: 'companyName', label: t('buyers.companyName') },
    { key: 'contactName', label: t('buyers.contactName') },
    { key: 'phone', label: t('buyers.phone') },
    { key: 'address', label: t('buyers.address') },
])
</script>
<template>
    <AppTable
        :rows="buyers"
        :columns="columns"
        :row-key="(buyer) => buyer.id"
        :caption="t('buyers.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-companyName="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.companyName
            }}</span></template
        >
        <template #cell-contactName="{ row }"
            ><span class="block max-w-48 whitespace-normal break-words">{{
                row.contactName
            }}</span></template
        >
        <template #cell-phone="{ row }">{{ row.phone || 'â€”' }}</template>
        <template #cell-address="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words text-muted">{{
                row.address || 'â€”'
            }}</span></template
        >
    </AppTable>
</template>
