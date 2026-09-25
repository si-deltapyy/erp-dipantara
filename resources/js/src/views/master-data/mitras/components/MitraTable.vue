<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Mitra } from '@/core/types/mitra'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps<{
    mitras: readonly Mitra[]
    state: 'ready' | 'loading' | 'error'
    canUpdate: boolean
}>()
defineEmits<{ edit: [mitra: Mitra]; retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Mitra>[]>(() => [
    { key: 'name', label: t('mitras.name') },
    { key: 'phone', label: t('mitras.phone') },
    { key: 'address', label: t('mitras.address') },
    { key: 'allowedActions', label: t('mitras.actions') },
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
        <template #cell-allowedActions="{ row }"
            ><AppButton
                v-if="canUpdate && row.allowedActions.includes('update')"
                variant="secondary"
                :aria-label="t('mitras.edit') + ': ' + row.name"
                @click="$emit('edit', row)"
                >{{ t('mitras.edit') }}</AppButton
            ><span v-else>—</span></template
        >
    </AppTable>
</template>
