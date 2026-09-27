<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, inject, nextTick, ref } from 'vue'
import { timberProductsApiKey } from '@/api/timber-products-api'
import { normalizeDecimalInput } from '@/core/domain/timber-measurements'
import type { TimberProduct } from '@/core/types/timber-product'
import { useTimberProductForm } from '../composables/useTimberProductForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import TimberProductFields from './TimberProductFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const props = defineProps<{ timberProduct?: TimberProduct }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useTimberProductForm(
    props.timberProduct,
    () => emit('saved'),
)
const api = inject(timberProductsApiKey)
const simulation = !!api?.previewVolume
const volume = computed(() => {
    if (api?.previewVolume)
        return api.previewVolume(
            normalizeDecimalInput(draft.value.diameterCm),
            normalizeDecimalInput(draft.value.lengthM),
        )
    const original = props.timberProduct
    return original &&
        draft.value.diameterCm === original.diameterCm &&
        draft.value.lengthM === original.lengthM
        ? original.volumeM3
        : null
})
const { confirming, requestDiscard, confirm, cancel } = useUnsavedChanges(
    () => dirty.value,
    () => pending.value && session.status === 'authenticated',
)
function close(): void {
    requestDiscard(() => emit('close'))
}
async function submit(): Promise<void> {
    await save()
    await nextTick()
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <AppModal
        :open="true"
        :title="t(timberProduct ? 'timber-products.edit' : 'timber-products.add')"
        initial-focus="#timber-product-name"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <TimberProductFields
                v-model="draft"
                :errors="errors"
                :disabled="pending || uncertain"
                :volume="volume"
                :simulation="simulation"
            />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'timber-products.errors.conflict'" class="mt-2">
                    {{ t('timber-products.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('timber-products.uncertain') }}</p>
            </div>
            <div class="flex flex-wrap justify-end gap-3">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('timber-products.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending">{{
                    t(uncertain ? 'timber-products.retry' : 'timber-products.save')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('timber-products.discardTitle')"
        :description="t('timber-products.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
