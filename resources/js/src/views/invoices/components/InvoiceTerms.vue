<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { useI18n } from 'vue-i18n'
import type { InvoiceTerm } from '@/core/types/invoice'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{
    terms: readonly InvoiceTerm[]
    errors: Record<string, string | undefined>
    disabled?: boolean
}>()
const emit = defineEmits<{ change: [terms: readonly InvoiceTerm[]] }>()
const { t } = useI18n()
function update(index: number, field: keyof InvoiceTerm, value: string): void {
    emit(
        'change',
        props.terms.map((term, position) =>
            position === index
                ? { ...term, [field]: field === 'dueDate' ? value || null : value }
                : term,
        ),
    )
}
</script>
<template>
    <AppPanel :title="t('invoices.terms')" class="space-y-5">
        <fieldset
            v-for="(term, index) in terms"
            :key="index"
            :disabled="disabled"
            class="grid min-w-0 gap-4 border-t border-line py-4 lg:grid-cols-3"
        >
            <legend class="px-2 font-semibold">{{ t('invoices.terms') }} {{ index + 1 }}</legend>
            <AppTextInput
                :id="`term-label-${index}`"
                :name="`terms.${index}.label`"
                :label="t('invoices.label')"
                :model-value="term.label"
                :maxlength="255"
                :error="
                    errors[`terms.${index}.label`] ? t(errors[`terms.${index}.label`] || '') : ''
                "
                @update:model-value="update(index, 'label', $event)"
            />
            <AppTextInput
                :id="`term-amount-${index}`"
                :name="`terms.${index}.amount`"
                :label="t('invoices.amount')"
                :model-value="term.amount"
                inputmode="decimal"
                :maxlength="20"
                :error="
                    errors[`terms.${index}.amount`] ? t(errors[`terms.${index}.amount`] || '') : ''
                "
                @update:model-value="update(index, 'amount', $event)"
            />
            <AppTextInput
                :id="`term-date-${index}`"
                :name="`terms.${index}.dueDate`"
                :label="t('invoices.dueDate')"
                :model-value="term.dueDate ?? ''"
                type="date"
                :error="
                    errors[`terms.${index}.dueDate`]
                        ? t(errors[`terms.${index}.dueDate`] || '')
                        : ''
                "
                @update:model-value="update(index, 'dueDate', $event)"
            />
            <AppButton
                variant="secondary"
                :disabled="disabled || terms.length === 1"
                @click="
                    emit(
                        'change',
                        terms.filter((_, position) => position !== index),
                    )
                "
                >{{ t('invoices.removeTerm') }}</AppButton
            >
        </fieldset>
        <p v-if="errors.terms" role="alert" class="text-red-700">{{ t(errors.terms) }}</p>
        <AppButton
            variant="secondary"
            :disabled="disabled || terms.length >= 50"
            @click="emit('change', [...terms, { label: '', amount: '', dueDate: null }])"
            >{{ t('invoices.addTerm') }}</AppButton
        >
    </AppPanel>
</template>
