<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import { useGradingRevisionForm } from '../composables/useGradingRevisionForm'
import { useGradingApi } from '../composables/useGradingApi'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import GradingRowsEditor from './GradingRowsEditor.vue'
import GradingMeasurements from './GradingMeasurements.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const props = defineProps<{ grading: Grading; assignment: Assignment }>()
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const api = useGradingApi()
const saved = ref(false)
const element = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useGradingRevisionForm(
    props.grading,
    (grading) => {
        saved.value = true
        void router.replace({ name: 'grading-detail', params: { id: grading.id } })
    },
)
const preview = computed(() => api.previewVolume?.(draft.value.rows))
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !saved.value && permitted.value && session.status === 'authenticated' && dirty.value,
    () => !saved.value && session.status === 'authenticated' && pending.value,
)
async function submit(): Promise<void> {
    await save()
    await nextTick()
    element.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <form ref="element" class="min-w-0 space-y-6" novalidate @submit.prevent="submit">
        <AppPanel :title="t('gradings.context')" :description="t('gradings.parentLocked')">
            <div class="grid gap-5 md:grid-cols-2">
                <p class="break-words font-semibold">
                    {{ assignment.purchaseOrderNumber }} / {{ assignment.mitraName }}
                </p>
                <AppTextInput
                    id="grading-date"
                    type="date"
                    :model-value="draft.gradingDate"
                    :label="t('gradings.gradingDate')"
                    :error="errors.gradingDate ? t(errors.gradingDate) : ''"
                    :disabled="pending || uncertain || !permitted"
                    @update:model-value="draft = { ...draft, gradingDate: $event }"
                />
                <AppTextarea
                    id="revision-reason"
                    :model-value="draft.reason"
                    :label="t('gradings.revisionReason')"
                    :maxlength="255"
                    :error="errors.reason ? t(errors.reason) : ''"
                    :disabled="pending || uncertain || !permitted"
                    @update:model-value="draft = { ...draft, reason: $event }"
                />
                <p class="text-sm text-muted">{{ t('gradings.revisionHint') }}</p>
            </div>
        </AppPanel>
        <AppPanel :title="t('gradings.previousResult')" class="min-w-0"
            ><GradingMeasurements :grading="grading"
        /></AppPanel>
        <AppPanel :title="t('gradings.revisedResult')">
            <GradingRowsEditor
                :rows="draft.rows"
                :assignment="assignment"
                :errors="errors"
                :disabled="pending || uncertain || !permitted"
                :preview="preview"
                @update:rows="draft = { ...draft, rows: $event }"
            />
            <p v-if="preview" class="text-sm text-muted">{{ t('gradings.previewHint') }}</p>
        </AppPanel>
        <div v-if="error" role="alert" class="space-y-2 break-words text-danger">
            <p>{{ t(error) }}</p>
            <p v-if="uncertain">{{ t('gradings.uncertain') }}</p>
            <p v-if="error === 'gradings.errors.conflict'">{{ t('gradings.conflictHint') }}</p>
        </div>
        <div class="wf-form-actions">
            <RouterLink
                :to="
                    grading
                        ? { name: 'grading-detail', params: { id: grading.id } }
                        : { name: 'assignment-detail', params: { id: assignment.id } }
                "
                class="secondary-button"
                >{{ t('gradings.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'gradings.retryWrite' : 'gradings.saveRevision')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('gradings.discardTitle')"
        :description="t('gradings.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
