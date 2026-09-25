<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TimberProductInput } from '@/core/types/timber-product'
import type { TimberProductField } from '@/core/domain/timber-product-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
defineProps<{
    prices: Pick<TimberProductInput, 'purchasePrice' | 'salePrice'>
    disabled: boolean
    fieldError: (field: TimberProductField) => string | undefined
}>()
defineEmits<{ update: [field: 'purchasePrice' | 'salePrice', value: string] }>()
const { t } = useI18n()
</script>
<template>
    <fieldset class="space-y-3">
        <legend class="font-semibold">{{ t('timber-products.prices') }}</legend>
        <div class="grid gap-4 sm:grid-cols-2">
            <AppTextInput
                v-for="field in ['purchasePrice', 'salePrice'] as const"
                :id="`timber-product-${field}`"
                :key="field"
                :model-value="prices[field]"
                :label="t(`timber-products.${field}`)"
                :error="fieldError(field)"
                :disabled="disabled"
                inputmode="decimal"
                aria-required="true"
                @update:model-value="$emit('update', field, $event)"
            />
        </div>
    </fieldset>
</template>
