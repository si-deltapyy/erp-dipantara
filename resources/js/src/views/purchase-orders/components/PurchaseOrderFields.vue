<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrderWriteInput } from '@/core/types/purchase-order'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
const props = defineProps<{
    modelValue: PurchaseOrderWriteInput
    errors: Partial<Record<keyof PurchaseOrderWriteInput, string>>
    disabled: boolean
    buyerName?: string
    productName?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: PurchaseOrderWriteInput] }>()
const { t, te } = useI18n()
const buyerLabel = ref(props.buyerName ?? '')
const productLabel = ref(props.productName ?? '')
function update(field: keyof PurchaseOrderWriteInput, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function message(field: keyof PurchaseOrderWriteInput): string | undefined {
    const error = props.errors[field]
    return error && te(error) ? t(error) : error
}
</script>
<template>
    <div class="grid gap-5 sm:grid-cols-2">
        <MasterLookup
            id="po-buyer"
            kind="buyer"
            :label="t('purchase-orders.buyer')"
            :model-value="modelValue.buyerId"
            :selected-label="buyerLabel"
            :error="message('buyerId')"
            :disabled="disabled"
            @update:model-value="update('buyerId', $event)"
            @selected="buyerLabel = $event"
        />
        <MasterLookup
            id="po-product"
            kind="timber"
            :label="t('purchase-orders.material')"
            :model-value="modelValue.productId"
            :selected-label="productLabel"
            :error="message('productId')"
            :disabled="disabled"
            @update:model-value="update('productId', $event)"
            @selected="productLabel = $event"
        />
        <AppTextInput
            id="po-number"
            :label="t('purchase-orders.number')"
            :model-value="modelValue.number"
            :error="message('number')"
            :disabled="disabled"
            :maxlength="255"
            required
            @update:model-value="update('number', $event)"
        />
        <AppTextInput
            v-for="field in ['orderDate', 'closingDate'] as const"
            :id="`po-${field}`"
            :key="field"
            type="date"
            :label="t(`purchase-orders.${field}`)"
            :model-value="modelValue[field]"
            :error="message(field)"
            :disabled="disabled"
            required
            @update:model-value="update(field, $event)"
        />
        <AppTextInput
            id="po-quantity"
            inputmode="numeric"
            :label="t('purchase-orders.quantityHeading')"
            :model-value="modelValue.quantity"
            :error="message('quantity')"
            :disabled="disabled"
            required
            @update:model-value="update('quantity', $event)"
        />
        <AppTextInput
            id="po-total"
            inputmode="numeric"
            :label="t('purchase-orders.totalAmount')"
            :hint="t('purchase-orders.totalHint')"
            :model-value="modelValue.totalAmount"
            :error="message('totalAmount')"
            :disabled="disabled"
            @update:model-value="update('totalAmount', $event)"
        />
        <AppTextarea
            id="po-notes"
            class="sm:col-span-2"
            :label="t('purchase-orders.notes')"
            :model-value="modelValue.notes"
            :error="message('notes')"
            :disabled="disabled"
            :maxlength="2000"
            @update:model-value="update('notes', $event)"
        />
    </div>
</template>
