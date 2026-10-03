<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimberProductRecord } from '@/core/types/timber-product'
import type { TableColumn } from '@/core/types/table'
import { formatMoney } from '@/core/formatting/money'
import AppTable from '@/components/ui/AppTable.vue'
const props = defineProps<{
    timberProducts: readonly TimberProductRecord[]
    state: 'ready' | 'loading' | 'error'
    canReadPrices: boolean
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<TimberProductRecord>[]>(() => {
    const fields: (keyof TimberProductRecord)[] = [
        'name',
        'type',
        'grade',
        'dimensionLength',
        'dimensionWidth',
        'dimensionHeight',
        'dimensionDiameter',
        'volume',
    ]
    if (props.canReadPrices) fields.push('price')
    return fields.map((key) => ({ key, label: t(`timber-products.${key}`) }))
})
</script>
<template>
    <AppTable
        :rows="timberProducts"
        :columns="columns"
        :row-key="(product) => product.id"
        :caption="t('timber-products.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-name="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.name
            }}</span></template
        >
        <template #cell-price="{ row }">{{ formatMoney(row.price) }}</template>
    </AppTable>
</template>
