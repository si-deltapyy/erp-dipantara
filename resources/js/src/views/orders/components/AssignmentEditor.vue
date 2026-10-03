<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order } from '@/core/types/order'
import type { Assignment } from '@/core/types/assignment'
import { useAssignmentForm } from '../composables/useAssignmentForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useSessionStore } from '@/stores/session'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ order: Order; assignment?: Assignment }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const completed = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useAssignmentForm(
    props.order,
    props.assignment,
    () => {
        completed.value = true
        emit('saved')
    },
)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !completed.value && session.status === 'authenticated' && dirty.value,
    () => !completed.value && session.status === 'authenticated' && pending.value,
)
const cancelling = ref(false)
function requestCancel(): void {
    if (pending.value) return
    if (dirty.value) cancelling.value = true
    else emit('cancel')
}
</script>
<template>
    <form class="space-y-5 border-y border-line py-5" @submit.prevent="save">
        <h3 class="text-lg font-semibold">
            {{ t(assignment ? 'assignments.edit' : 'assignments.add') }}
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
            <MasterLookup
                id="assignment-mitra"
                kind="mitra"
                :label="t('assignments.mitra')"
                :model-value="draft.mitraId"
                :selected-label="assignment?.mitraName"
                :disabled="pending || uncertain || !permitted"
                :error="errors.mitraId ? t(errors.mitraId) : ''"
                name="mitraId"
                @update:model-value="draft = { ...draft, mitraId: $event }"
            />
            <MasterLookup
                id="assignment-grader"
                kind="grader"
                :label="t('assignments.grader')"
                :model-value="draft.graderId"
                :selected-label="assignment?.graderName"
                :disabled="pending || uncertain || !permitted"
                :error="errors.graderId ? t(errors.graderId) : ''"
                name="graderId"
                @update:model-value="draft = { ...draft, graderId: $event }"
            />
            <MasterLookup
                id="assignment-timber"
                kind="timber"
                :label="t('assignments.timber')"
                :model-value="draft.timberProductId"
                :selected-label="assignment?.timberProductName"
                :disabled="pending || uncertain || !permitted"
                :error="errors.timberProductId ? t(errors.timberProductId) : ''"
                name="timberProductId"
                @update:model-value="draft = { ...draft, timberProductId: $event }"
            />
            <AppTextInput
                id="assignment-quantity"
                name="quantity"
                inputmode="numeric"
                min="1"
                step="1"
                :label="t('assignments.quantity')"
                :model-value="String(draft.quantity)"
                :disabled="pending || uncertain || !permitted"
                :error="errors.quantity ? t(errors.quantity) : ''"
                @update:model-value="draft = { ...draft, quantity: Number($event) }"
            />
        </div>
        <p class="text-sm text-muted">{{ t('assignments.activeHint') }}</p>
        <p v-if="error" role="alert" class="text-danger">{{ t(error) }}</p>
        <p v-if="uncertain" role="status">{{ t('orders.uncertain') }}</p>
        <div class="wf-form-actions">
            <AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'orders.retryWrite' : 'assignments.save')
            }}</AppButton
            ><AppButton variant="secondary" :disabled="pending" @click="requestCancel">{{
                t('orders.cancel')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('orders.discardTitle')"
        :description="t('orders.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
    <AppConfirmDialog
        :open="cancelling"
        :title="t('orders.discardTitle')"
        :description="t('orders.discardDescription')"
        @confirm="emit('cancel')"
        @cancel="cancelling = false"
    />
</template>
