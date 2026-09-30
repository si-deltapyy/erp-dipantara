<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useMasterLookup } from '@/composables/useMasterLookup'
const props = defineProps<{
    id: string
    kind: 'buyer' | 'timber' | 'mitra' | 'grader'
    label: string
    modelValue: string
    selectedLabel?: string
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; selected: [label: string] }>()
const { t } = useI18n()
const selected = computed(() => ({ id: props.modelValue, label: props.selectedLabel ?? '' }))
const {
    search,
    options,
    loading,
    error: lookupError,
    load,
    hasMore,
} = useMasterLookup(props.kind, selected)
function choose(value: string): void {
    emit('update:modelValue', value)
    emit('selected', options.value.find((option) => option.value === value)?.label ?? '')
}
</script>
<template>
    <div class="min-w-0 space-y-2">
        <AppSelect
            :id="id"
            :model-value="modelValue"
            :label="label"
            :options="[{ value: '', label: t('purchase-orders.choose') }, ...options]"
            :error="error"
            :disabled="disabled"
            @update:model-value="choose"
        />
        <div class="flex flex-wrap items-end gap-2">
            <div class="min-w-40 flex-1">
                <AppTextInput
                    :id="id + '-search'"
                    v-model="search"
                    :label="t('purchase-orders.lookupSearch', { label })"
                    :maxlength="200"
                    :disabled="disabled"
                    @keydown.enter.prevent="load()"
                />
            </div>
            <AppButton
                variant="secondary"
                :disabled="disabled"
                :pending="loading"
                @click="load()"
                >{{ t('purchase-orders.searchAction') }}</AppButton
            >
            <AppButton
                v-if="hasMore"
                variant="secondary"
                :disabled="disabled || loading"
                @click="load(false)"
                >{{ t('purchase-orders.more') }}</AppButton
            >
        </div>
        <p v-if="lookupError" role="alert" class="text-sm text-red-700">{{ t(lookupError) }}</p>
    </div>
</template>
