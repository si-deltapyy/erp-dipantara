<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, ref } from 'vue'
import type { GraderRecord } from '@/core/types/grader'
import { useGraderForm } from '../composables/useGraderForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import GraderFields from './GraderFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const props = defineProps<{ grader: GraderRecord }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useGraderForm(props.grader, () =>
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
        :title="t('graders.edit')"
        initial-focus="#grader-phone"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <p class="text-sm font-semibold">{{ grader.name }}</p>
            <GraderFields v-model="draft" :errors="errors" :disabled="pending || uncertain" />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'graders.errors.conflict'" class="mt-2">
                    {{ t('graders.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('graders.uncertain') }}</p>
            </div>
            <div class="wf-form-actions">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('graders.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending" :disabled="uncertain">{{
                    t('graders.save')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('graders.discardTitle')"
        :description="t('graders.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
