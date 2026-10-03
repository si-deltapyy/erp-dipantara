<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrderInput, PurchaseOrderLineInput } from '@/core/types/purchase-order'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PurchaseOrderLookup from './PurchaseOrderLookup.vue'
const props = defineProps<{
    modelValue: PurchaseOrderInput
    errors: Readonly<Record<string, string | undefined>>
    disabled: boolean
    buyerName?: string
    timberNames?: readonly string[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: PurchaseOrderInput] }>()
const { t } = useI18n()
const buyerLabel = ref(props.buyerName ?? '')
const rowKeys = ref(props.modelValue.lines.map(() => crypto.randomUUID()))
const labels = ref([...(props.timberNames ?? [])])
function field<K extends keyof PurchaseOrderInput>(key: K, value: PurchaseOrderInput[K]): void {
    emit('update:modelValue', { ...props.modelValue, [key]: value })
}
function line(index: number, patch: Partial<PurchaseOrderLineInput>): void {
    field(
        'lines',
        props.modelValue.lines.map((row, position) =>
            position === index ? { ...row, ...patch } : row,
        ),
    )
}
function add(): void {
    rowKeys.value.push(crypto.randomUUID())
    labels.value.push('')
    field('lines', [...props.modelValue.lines, { timberProductId: '', quantity: 1, unitPrice: '' }])
}
function remove(index: number): void {
    rowKeys.value.splice(index, 1)
    labels.value.splice(index, 1)
    field(
        'lines',
        props.modelValue.lines.filter((_, position) => position !== index),
    )
}
function message(path: string): string | undefined {
    return props.errors[path] ? t(props.errors[path]) : undefined
}
</script>
<template>
    <div class="space-y-6">
        <PurchaseOrderLookup
            id="po-buyer"
            kind="buyer"
            :label="t('purchase-orders.buyer')"
            :model-value="modelValue.buyerId"
            :selected-label="buyerLabel"
            :error="message('buyerId')"
            :disabled="disabled"
            @update:model-value="field('buyerId', $event)"
            @selected="buyerLabel = $event"
        />
        <div class="grid gap-4 sm:grid-cols-2">
            <AppTextInput
                id="po-number"
                :label="t('purchase-orders.number')"
                :model-value="modelValue.number"
                :maxlength="255"
                :error="message('number')"
                :disabled="disabled"
                @update:model-value="field('number', $event)"
            />
            <AppTextInput
                id="po-date"
                type="date"
                :label="t('purchase-orders.orderDate')"
                :model-value="modelValue.orderDate"
                :error="message('orderDate')"
                :disabled="disabled"
                @update:model-value="field('orderDate', $event)"
            />
        </div>
        <div class="space-y-5 border-t border-line pt-6">
            <h2 class="text-lg font-semibold">{{ t('purchase-orders.lines') }}</h2>
            <p class="text-sm text-muted">{{ t('purchase-orders.priceHint') }}</p>
            <p v-if="message('lines')" role="alert" class="text-sm text-danger">
                {{ message('lines') }}
            </p>
            <fieldset
                v-for="(row, index) in modelValue.lines"
                :key="rowKeys[index]"
                class="min-w-0 space-y-4 border-b border-line pb-6"
                :disabled="disabled"
            >
                <legend class="mb-4 text-sm font-semibold">
                    {{ t('purchase-orders.line', { number: index + 1 }) }}
                </legend>
                <PurchaseOrderLookup
                    :id="'po-timber-' + rowKeys[index]"
                    kind="timber"
                    :label="t('purchase-orders.timber', { number: index + 1 })"
                    :model-value="row.timberProductId"
                    :selected-label="labels[index]"
                    :error="message(`lines.${index}.timberProductId`)"
                    :disabled="disabled"
                    @update:model-value="line(index, { timberProductId: $event })"
                    @selected="labels[index] = $event"
                />
                <div class="grid gap-4 sm:grid-cols-2">
                    <AppTextInput
                        :id="'po-quantity-' + rowKeys[index]"
                        inputmode="numeric"
                        :label="t('purchase-orders.quantity', { number: index + 1 })"
                        :model-value="String(row.quantity)"
                        :error="message(`lines.${index}.quantity`)"
                        :disabled="disabled"
                        @update:model-value="line(index, { quantity: Number($event) })"
                    />
                    <AppTextInput
                        :id="'po-price-' + rowKeys[index]"
                        inputmode="decimal"
                        :label="t('purchase-orders.price', { number: index + 1 })"
                        :model-value="row.unitPrice"
                        :error="message(`lines.${index}.unitPrice`)"
                        :disabled="disabled"
                        @update:model-value="line(index, { unitPrice: $event })"
                    />
                </div>
                <AppButton
                    variant="secondary"
                    :disabled="disabled || modelValue.lines.length === 1"
                    @click="remove(index)"
                    >{{ t('purchase-orders.removeLine', { number: index + 1 }) }}</AppButton
                >
            </fieldset>
            <AppButton variant="secondary" :disabled="disabled" @click="add">{{
                t('purchase-orders.addLine')
            }}</AppButton>
        </div>
        <AppTextarea
            id="po-notes"
            :label="t('purchase-orders.notes')"
            :model-value="modelValue.notes ?? ''"
            :maxlength="2000"
            :error="message('notes')"
            :disabled="disabled"
            @update:model-value="field('notes', $event || null)"
        />
    </div>
</template>
