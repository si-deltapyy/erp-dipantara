<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DeliveryDocument } from '@/core/types/delivery'
import type { DocumentReference } from '@/core/types/document'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
const props = defineProps<{
    documents: readonly DeliveryDocument[]
    files: readonly DocumentReference[]
    disabled: boolean
}>()
const emit = defineEmits<{ change: [documents: readonly DeliveryDocument[]] }>()
const { t } = useI18n()
const directions = ['farmer_to_company', 'company_to_buyer'] as const
function field(direction: DeliveryDocument['direction']): DeliveryDocument {
    return (
        props.documents.find((document) => document.direction === direction) ?? {
            direction,
            documentId: '',
            number: '',
            documentDate: '',
        }
    )
}
function update(direction: DeliveryDocument['direction'], patch: Partial<DeliveryDocument>): void {
    const next = { ...field(direction), ...patch }
    const remaining = props.documents.filter((document) => document.direction !== direction)
    emit(
        'change',
        next.documentId || next.number || next.documentDate ? [...remaining, next] : remaining,
    )
}
</script>
<template>
    <div class="space-y-5">
        <fieldset
            v-for="direction in directions"
            :key="direction"
            class="space-y-3 rounded-md border border-line p-4"
            :disabled="disabled"
        >
            <legend class="px-2 font-semibold">
                {{ t('deliveries.directions.' + direction) }}
            </legend>
            <AppSelect
                :id="direction + '-file'"
                :label="t('deliveries.sakrFile')"
                :model-value="field(direction).documentId"
                :disabled="disabled"
                :options="[
                    { value: '', label: t('deliveries.chooseFile') },
                    ...files.map((file) => ({ value: file.id, label: file.fileName })),
                ]"
                @update:model-value="update(direction, { documentId: $event })"
            />
            <div class="grid gap-3 sm:grid-cols-2">
                <AppTextInput
                    :id="direction + '-number'"
                    :label="t('deliveries.sakrNumber')"
                    :model-value="field(direction).number"
                    :maxlength="255"
                    :disabled="disabled"
                    @update:model-value="update(direction, { number: $event })"
                /><AppTextInput
                    :id="direction + '-date'"
                    type="date"
                    :label="t('deliveries.sakrDate')"
                    :model-value="field(direction).documentDate"
                    :disabled="disabled"
                    @update:model-value="update(direction, { documentDate: $event })"
                />
            </div>
        </fieldset>
    </div>
</template>
