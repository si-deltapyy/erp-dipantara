<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { GradingCreateInput } from '@/core/types/grading'
import { useSessionStore } from '@/stores/session'
import { useGradingForm } from '../composables/useGradingForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import PurchaseOrderLookup from '@/views/purchase-orders/components/PurchaseOrderLookup.vue'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t, te } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useSessionStore()
const formElement = ref<HTMLFormElement>()
const saved = ref(false)
const lookups = [
    { kind: 'mitra', field: 'mitraId' },
    { kind: 'grader', field: 'graderId' },
    { kind: 'timber', field: 'productId' },
] as const
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useGradingForm(() => {
    saved.value = true
    void router.replace({
        name: 'gradings',
        query: route.query,
    })
})
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !saved.value && permitted.value && store.status === 'authenticated' && dirty.value,
    () => !saved.value && store.status === 'authenticated' && pending.value,
)
async function submit(): Promise<void> {
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
function message(field: keyof GradingCreateInput): string | undefined {
    const error = errors.value[field]
    return error && te(error) ? t(error) : error
}
</script>
<template>
    <form ref="formElement" class="panel space-y-6" novalidate @submit.prevent="submit">
        <PurchaseOrderLookup
            id="grading-po"
            :model-value="draft.purchaseOrderId"
            :label="t('gradings.number')"
            :error="message('purchaseOrderId')"
            :disabled="pending || uncertain || !permitted"
            :name="'purchaseOrderId'"
            @update:model-value="draft = { ...draft, purchaseOrderId: $event }"
        />
        <div class="grid gap-5 sm:grid-cols-2">
            <MasterLookup
                v-for="lookup in lookups"
                :id="`grading-${lookup.kind}`"
                :key="lookup.field"
                :kind="lookup.kind"
                :label="t(`gradings.${lookup.kind}`)"
                :model-value="draft[lookup.field]"
                :error="message(lookup.field)"
                :disabled="pending || uncertain || !permitted"
                :name="lookup.field"
                @update:model-value="draft = { ...draft, [lookup.field]: $event }"
            />
            <AppTextInput
                id="grading-date"
                type="date"
                :label="t('gradings.gradingDate')"
                :model-value="draft.gradingDate"
                :error="message('gradingDate')"
                :disabled="pending || uncertain || !permitted"
                required
                :name="'gradingDate'"
                @update:model-value="draft = { ...draft, gradingDate: $event }"
            />
        </div>
        <AppTextarea
            id="grading-notes"
            :model-value="draft.notes ?? ''"
            :label="t('gradings.notes')"
            :maxlength="255"
            :error="message('notes')"
            :disabled="pending || uncertain || !permitted"
            :name="'notes'"
            @update:model-value="draft = { ...draft, notes: $event }"
        />
        <div
            v-if="error"
            role="alert"
            class="rounded-md border border-danger/20 bg-danger-light p-4 text-sm text-danger"
        >
            <p>{{ t(error) }}</p>
            <p v-if="error === 'gradings.errors.conflict'">
                {{ t('gradings.conflictHint') }}
            </p>
            <p v-if="uncertain">{{ t('gradings.uncertain') }}</p>
        </div>
        <div class="wf-form-actions">
            <RouterLink
                :to="{
                    name: 'gradings',
                    query: $route.query,
                }"
                class="secondary-button"
                >{{ t('gradings.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted || uncertain">{{
                t('gradings.save')
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
