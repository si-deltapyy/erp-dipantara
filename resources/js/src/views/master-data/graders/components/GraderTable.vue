<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GraderRecord } from '@/core/types/grader'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{
    graders: readonly GraderRecord[]
    state: 'ready' | 'loading' | 'error'
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<GraderRecord>[]>(() => [
    { key: 'name', label: t('graders.name') },
    { key: 'phone', label: t('graders.phone') },
    { key: 'graderGroup', label: t('graders.graderGroup') },
])
</script>
<template>
    <AppTable
        :rows="graders"
        :columns="columns"
        :row-key="(grader) => grader.id"
        :caption="t('graders.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-name="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.name
            }}</span></template
        >
        <template #cell-phone="{ row }">{{ row.phone || '—' }}</template>
    </AppTable>
</template>
