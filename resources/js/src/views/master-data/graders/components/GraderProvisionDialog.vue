<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grader } from '@/core/types/grader'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useGraderProvision } from '../composables/useGraderProvision'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const props = defineProps<{ grader: Grader }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const { error, pending, uncertain, save } = useGraderProvision(props.grader, () => emit('saved'))
const { confirming, requestDiscard, confirm, cancel } = useUnsavedChanges(
    () => uncertain.value && session.status === 'authenticated',
    () => pending.value && session.status === 'authenticated',
)
function close(): void {
    requestDiscard(() => emit('close'))
}
</script>
<template>
    <AppModal
        :open="true"
        :title="t('graders.provisionTitle')"
        :busy="pending"
        initial-focus="#grader-provision-cancel"
        @close="close"
    >
        <form class="space-y-5" @submit.prevent="save">
            <p>{{ t('graders.provisionDescription', { name: grader.name }) }}</p>
            <p class="break-words font-semibold">{{ grader.email }}</p>
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'graders.errors.conflict'" class="mt-2">
                    {{ t('graders.provisionConflict') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('graders.uncertain') }}</p>
            </div>
            <div class="flex flex-wrap justify-end gap-3">
                <AppButton
                    id="grader-provision-cancel"
                    variant="secondary"
                    :disabled="pending"
                    @click="close"
                    >{{ t('graders.cancel') }}</AppButton
                >
                <AppButton type="submit" :pending="pending">{{
                    t(uncertain ? 'graders.provisionRetry' : 'graders.provision')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('graders.discardTitle')"
        :description="t('graders.uncertain')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
