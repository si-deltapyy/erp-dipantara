<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimberSpecification } from '@/core/types/timber-product'
import type { TimberProductField } from '@/core/domain/timber-product-validation'
import { normalizeDecimalInput, timberDiameterCategory } from '@/core/domain/timber-measurements'
import AppTextInput from '@/components/ui/AppTextInput.vue'
const props = defineProps<{
    specification: TimberSpecification
    disabled: boolean
    fieldError: (field: TimberProductField) => string | undefined
    volume: string | null
    simulation: boolean
}>()
defineEmits<{ update: [field: 'diameterCm' | 'lengthM', value: string] }>()
const { t } = useI18n()
const category = computed(() =>
    timberDiameterCategory(normalizeDecimalInput(props.specification.diameterCm)),
)
</script>
<template>
    <fieldset class="space-y-3">
        <legend class="font-semibold">{{ t('timber-products.dimensions') }}</legend>
        <div class="grid gap-4 sm:grid-cols-2">
            <AppTextInput
                v-for="field in ['diameterCm', 'lengthM'] as const"
                :id="`timber-product-${field}`"
                :key="field"
                :model-value="specification[field]"
                :label="t(`timber-products.${field}`)"
                :error="fieldError(field)"
                :disabled="disabled"
                inputmode="decimal"
                aria-required="true"
                @update:model-value="$emit('update', field, $event)"
            />
        </div>
        <div
            class="space-y-2 rounded-md border border-line bg-canvas p-3 text-sm"
            aria-live="polite"
        >
            <p>
                {{ t('timber-products.category') }}: <strong>{{ category ?? '—' }}</strong>
            </p>
            <p>
                {{ t('timber-products.volumeM3') }}: <strong>{{ volume ?? '—' }}</strong>
            </p>
            <p class="text-muted">
                {{ t(simulation ? 'timber-products.preview' : 'timber-products.serverVolume') }}
            </p>
        </div>
    </fieldset>
</template>
