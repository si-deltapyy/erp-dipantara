<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Buyer } from '@/core/types/buyer'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps<{
    buyers: readonly Buyer[]
    state: 'ready' | 'loading' | 'error'
    canUpdate: boolean
}>()
defineEmits<{ edit: [buyer: Buyer]; retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Buyer>[]>(() => [
    { key: 'companyName', label: t('buyers.companyName') },
    { key: 'contactName', label: t('buyers.contactName') },
    { key: 'phone', label: t('buyers.phone') },
    { key: 'address', label: t('buyers.address') },
    { key: 'allowedActions', label: t('buyers.actions') },
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
        <template #cell-phone="{ row }">{{ row.phone || '—' }}</template>
        <template #cell-address="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words text-muted">{{
                row.address || '—'
            }}</span></template
        >
        <template #cell-allowedActions="{ row }"
            ><AppButton
                v-if="canUpdate && row.allowedActions.includes('update')"
                variant="secondary"
                :aria-label="t('buyers.edit') + ': ' + row.companyName"
                @click="$emit('edit', row)"
                >{{ t('buyers.edit') }}</AppButton
            ><span v-else>—</span></template
        >
    </AppTable>
</template>
