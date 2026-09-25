<script setup lang="ts" generic="Row extends object">
import type { TableColumn, TableSort } from '@/core/types/table'
import AppState from './AppState.vue'
const props = withDefaults(
    defineProps<{
        rows: readonly Row[]
        columns: readonly TableColumn<Row>[]
        rowKey: (row: Row) => string
        caption: string
        state?: 'ready' | 'loading' | 'error'
        sort?: TableSort
    }>(),
    { state: 'ready', sort: undefined },
)
const emit = defineEmits<{ sort: [value: TableSort]; retry: [] }>()
function changeSort(key: string): void {
    emit('sort', {
        key,
        direction: props.sort?.key === key && props.sort.direction === 'asc' ? 'desc' : 'asc',
    })
}
</script>
<template>
    <AppState v-if="state !== 'ready'" :kind="state" @retry="$emit('retry')" />
    <AppState v-else-if="!rows.length" kind="empty" />
    <div
        v-else
        class="max-w-full overflow-x-auto rounded-md border border-line"
        tabindex="0"
        role="region"
        :aria-label="caption"
    >
        <table class="w-full text-left text-sm">
            <caption class="sr-only">
                {{
                    caption
                }}
            </caption>
            <thead class="bg-canvas">
                <tr>
                    <th
                        v-for="column in columns"
                        :key="column.key"
                        scope="col"
                        class="whitespace-nowrap px-4 py-3"
                        :aria-sort="
                            column.sortable
                                ? sort?.key === column.key
                                    ? sort.direction === 'asc'
                                        ? 'ascending'
                                        : 'descending'
                                    : 'none'
                                : undefined
                        "
                    >
                        <button
                            v-if="column.sortable"
                            type="button"
                            @click="changeSort(column.key)"
                        >
                            {{ column.label }} <span aria-hidden="true">↕</span>
                        </button>
                        <template v-else>{{ column.label }}</template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="rowKey(row)" class="border-t border-line">
                    <td
                        v-for="column in columns"
                        :key="column.key"
                        class="whitespace-nowrap px-4 py-3"
                    >
                        <slot :name="'cell-' + column.key" :row="row" :value="row[column.key]">{{
                            row[column.key]
                        }}</slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
