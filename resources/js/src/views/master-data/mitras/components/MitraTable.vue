<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MitraRecord } from '@/core/types/mitra'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{
    mitras: readonly MitraRecord[]
    state: 'ready' | 'loading' | 'error'
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<MitraRecord>[]>(() => [
    { key: 'name', label: t('mitras.name') },
    { key: 'phone', label: t('mitras.phone') },
    { key: 'address', label: t('mitras.address') },
    { key: 'graderGroup', label: t('mitras.graderGroup') },
])
</script>
<template>
    <AppTable
        :rows="mitras"
        :columns="columns"
        :row-key="(mitra) => mitra.id"
        :caption="t('mitras.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-name="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.name
            }}</span></template
        >
        <template #cell-phone="{ row }">{{ row.phone || '—' }}</template>
        <template #cell-address="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words text-muted">{{
                row.address || '—'
            }}</span></template
        >
    </AppTable>
</template>
