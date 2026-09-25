<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTable from '@/components/ui/AppTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { TableColumn, TableSort } from '@/core/types/table'
interface SampleRow {
    id: string
    name: string
    category: string
    actions: string
}
const { t } = useI18n()
const page = ref(1)
const state = ref('ready')
const selected = ref<SampleRow>()
const sort = ref<TableSort>({ key: 'name', direction: 'asc' })
const fixtures = computed<SampleRow[]>(() =>
    Array.from({ length: 7 }, (_, index) => ({
        id: 'sample-' + index,
        name: t('ui.example') + ' 00' + (index + 1),
        category: t(index % 2 ? 'ui.second' : 'ui.first'),
        actions: '',
    })),
)
const columns = computed<readonly TableColumn<SampleRow>[]>(() => [
    { key: 'name', label: t('ui.name'), sortable: true },
    { key: 'category', label: t('ui.category') },
    { key: 'actions', label: t('ui.actions') },
])
const rows = computed(() => {
    if (state.value === 'empty') return []
    const sorted = [...fixtures.value].sort(
        (left, right) =>
            left.name.localeCompare(right.name) * (sort.value.direction === 'asc' ? 1 : -1),
    )
    return sorted.slice((page.value - 1) * 3, page.value * 3)
})
const options = computed(() =>
    ['ready', 'loading', 'empty', 'error'].map((value) => ({ value, label: t('ui.' + value) })),
)
watch([state, sort], () => {
    page.value = 1
})
function rowKey(row: SampleRow): string {
    return row.id
}
</script>
<template>
    <section class="panel min-w-0 space-y-5">
        <h2 class="text-lg font-bold">{{ t('ui.table') }}</h2>
        <AppSelect id="table-state" v-model="state" :label="t('ui.state')" :options="options" />
        <AppTable
            :rows="rows"
            :columns="columns"
            :row-key="rowKey"
            :caption="t('ui.table')"
            :sort="sort"
            :state="state === 'loading' || state === 'error' ? state : 'ready'"
            @sort="sort = $event"
            @retry="state = 'ready'"
        >
            <template #cell-actions="{ row }"
                ><AppButton variant="secondary" @click="selected = row">{{
                    t('ui.preview')
                }}</AppButton></template
            >
        </AppTable>
        <AppPagination
            v-model:page="page"
            :page-size="3"
            :total="state === 'empty' ? 0 : fixtures.length"
            :disabled="state !== 'ready'"
        />
        <AppModal :open="!!selected" :title="t('ui.dialog')" @close="selected = undefined">
            <p>{{ selected?.name }}</p>
        </AppModal>
    </section>
</template>
