<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, ref } from 'vue'
import type { Buyer } from '@/core/types/buyer'
import { useBuyerForm } from '../composables/useBuyerForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import BuyerFields from './BuyerFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const props = defineProps<{ buyer?: Buyer }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useBuyerForm(props.buyer, () =>
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
        :title="t(buyer ? 'buyers.edit' : 'buyers.add')"
        initial-focus="#buyer-company"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <BuyerFields v-model="draft" :errors="errors" :disabled="pending || uncertain" />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'buyers.errors.conflict'" class="mt-2">
                    {{ t('buyers.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('buyers.uncertain') }}</p>
            </div>
            <div class="flex flex-wrap justify-end gap-3">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('buyers.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending">{{
                    t(uncertain ? 'buyers.retry' : 'buyers.save')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('buyers.discardTitle')"
        :description="t('buyers.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
