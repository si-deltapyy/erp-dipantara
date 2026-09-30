<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GradingRow } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import { newGradingRow } from '@/core/domain/grading-draft'
import { normalizeDecimalInput } from '@/core/domain/timber-measurements'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{
    rows: readonly GradingRow[]
    assignment: Assignment
    errors: Readonly<Record<string, string | undefined>>
    disabled: boolean
    preview?: readonly { rowId: string; volumeM3: string }[]
}>()
const emit = defineEmits<{ 'update:rows': [rows: readonly GradingRow[]] }>()
const { t } = useI18n()
function update(rowId: string, patch: Partial<GradingRow>): void {
    emit(
        'update:rows',
        props.rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    )
}
function fieldError(index: number, field: string): string {
    const message = props.errors[`rows.${index}.${field}`]
    return message ? t(message) : ''
}
</script>
<template>
    <div class="space-y-4">
        <p class="text-sm text-muted">{{ t('gradings.inputHint') }}</p>
        <p v-if="errors.rows" role="alert" class="text-red-700">{{ t(errors.rows) }}</p>
        <fieldset
            v-for="(row, index) in rows"
            :key="row.rowId"
            :disabled="disabled"
            class="space-y-4 rounded-md border border-slate-200 p-4"
        >
            <legend class="px-2 font-semibold">
                {{ t('gradings.line', { number: index + 1 }) }}
            </legend>
            <p>{{ assignment.timberProductName }}</p>
            <div class="grid gap-4 sm:grid-cols-2">
                <AppTextInput
                    :id="row.rowId + '-quantity'"
                    :model-value="String(row.quantity)"
                    :label="t('gradings.quantity')"
                    inputmode="numeric"
                    :error="fieldError(index, 'quantity')"
                    @update:model-value="update(row.rowId, { quantity: Number($event) })"
                />
                <AppTextInput
                    :id="row.rowId + '-diameter'"
                    :model-value="row.diameterCm"
                    :label="t('gradings.diameter')"
                    inputmode="decimal"
                    :error="fieldError(index, 'diameterCm')"
                    @update:model-value="
                        update(row.rowId, { diameterCm: normalizeDecimalInput($event) })
                    "
                />
                <AppTextInput
                    :id="row.rowId + '-length'"
                    :model-value="row.lengthM"
                    :label="t('gradings.length')"
                    inputmode="decimal"
                    :error="fieldError(index, 'lengthM')"
                    @update:model-value="
                        update(row.rowId, { lengthM: normalizeDecimalInput($event) })
                    "
                />
                <AppSelect
                    :id="row.rowId + '-grade'"
                    :model-value="row.gradeCode"
                    :label="t('gradings.grade')"
                    :options="
                        assignment.gradingReference.gradeCodes.map((code) => ({
                            value: code,
                            label: code,
                        }))
                    "
                    :error="fieldError(index, 'gradeCode')"
                    @update:model-value="update(row.rowId, { gradeCode: $event })"
                />
            </div>
            <p v-if="preview?.some((result) => result.rowId === row.rowId)" role="status">
                {{ t('gradings.preview') }}:
                {{ preview.find((result) => result.rowId === row.rowId)?.volumeM3 }} m³
            </p>
            <AppButton
                variant="secondary"
                :disabled="disabled || rows.length < 2"
                @click="
                    emit(
                        'update:rows',
                        rows.filter((candidate) => candidate.rowId !== row.rowId),
                    )
                "
                >{{ t('gradings.removeLine', { number: index + 1 }) }}</AppButton
            >
        </fieldset>
        <AppButton
            variant="secondary"
            :disabled="disabled"
            @click="emit('update:rows', [...rows, newGradingRow(assignment)])"
            >{{ t('gradings.addLine') }}</AppButton
        >
    </div>
</template>
