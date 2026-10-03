<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, ref } from 'vue'
import { useTimberProductForm } from '../composables/useTimberProductForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import TimberProductFields from './TimberProductFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useTimberProductForm(() =>
    emit('saved'),
)
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
        class="max-w-2xl"
        :open="true"
        :title="t('timber-products.add')"
        initial-focus="#timber-product-name"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <TimberProductFields
                v-model="draft"
                :errors="errors"
                :disabled="pending || uncertain"
            />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'timber-products.errors.conflict'" class="mt-2">
                    {{ t('timber-products.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('timber-products.uncertain') }}</p>
            </div>
            <div class="wf-form-actions">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('timber-products.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending" :disabled="uncertain">{{
                    t('timber-products.save')
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
