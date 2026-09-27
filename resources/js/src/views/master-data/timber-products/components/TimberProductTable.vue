<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimberProduct } from '@/core/types/timber-product'
import type { TableColumn } from '@/core/types/table'
import { timberDiameterCategory } from '@/core/domain/timber-measurements'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{
    timberProducts: readonly TimberProduct[]
    state: 'ready' | 'loading' | 'error'
    canUpdate: boolean
    canReadPrices: boolean
}>()
defineEmits<{ edit: [product: TimberProduct]; retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<TimberProduct>[]>(() => {
    const fields: (keyof TimberProduct)[] = [
        'name',
        'gradeCode',
        'diameterCm',
        'lengthM',
        'volumeM3',
    ]
    if (props.canReadPrices) fields.push('purchasePrice', 'salePrice')
    return [
        ...fields.map((key) => ({ key, label: t(`timber-products.${key}`) })),
        { key: 'allowedActions', label: t('timber-products.actions') },
    ]
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
        <template #cell-gradeCode="{ row }"
            ><span class="block max-w-48 whitespace-normal break-words">{{
                row.gradeCode
            }}</span></template
        >
        <template #cell-diameterCm="{ row }"
            >{{ row.diameterCm }} · {{ timberDiameterCategory(row.diameterCm) }}</template
        >
        <template #cell-allowedActions="{ row }">
            <AppButton
                v-if="canUpdate && row.allowedActions.includes('update')"
                variant="secondary"
                :aria-label="t('timber-products.edit') + ': ' + row.name"
                @click="$emit('edit', row)"
                >{{ t('timber-products.edit') }}</AppButton
            >
            <span v-else>—</span>
        </template>
    </AppTable>
</template>
