<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, ref } from 'vue'
import type { MitraRecord } from '@/core/types/mitra'
import { useMitraForm } from '../composables/useMitraForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import MitraFields from './MitraFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const props = defineProps<{ mitra?: MitraRecord }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useMitraForm(props.mitra, () =>
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
        :open="true"
        :title="t(mitra ? 'mitras.edit' : 'mitras.add')"
        initial-focus="#mitra-name"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <MitraFields v-model="draft" :errors="errors" :disabled="pending || uncertain" />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'mitras.errors.conflict'" class="mt-2">
                    {{ t('mitras.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('mitras.uncertain') }}</p>
            </div>
            <div class="wf-form-actions">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('mitras.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending" :disabled="uncertain">{{
                    t('mitras.save')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('mitras.discardTitle')"
        :description="t('mitras.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
