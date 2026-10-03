<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { ClosingEligibility } from '@/core/types/closing'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useClosingRequest } from '../composables/useClosingRequest'
import InvoiceBalancePanel from '@/views/invoices/components/InvoiceBalancePanel.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ eligibility: ClosingEligibility }>()
const { t } = useI18n()
const session = useSessionStore()
const router = useRouter()
const completed = ref(false)
const confirmingRequest = ref(false)
const form = reactive(
    useClosingRequest(props.eligibility, (closing) => {
        completed.value = true
        void router.replace({ name: 'closing-detail', params: { id: closing.id } })
    }),
)
const discard = reactive(
    useUnsavedChanges(
        () => !completed.value && session.status === 'authenticated' && form.dirty,
        () => !completed.value && session.status === 'authenticated' && form.pending,
    ),
)
function setNotes(notes: string): void {
    form.draft = { ...form.draft, notes: notes || null }
}
async function submit(): Promise<void> {
    confirmingRequest.value = false
    await form.save()
}
</script>
<template>
    <form class="min-w-0 space-y-6" @submit.prevent="confirmingRequest = true">
        <AppPanel :title="t('closings.eligibility')" class="space-y-5 break-words">
            <AppStatusBadge :tone="form.eligibility.eligible ? 'success' : 'warning'">{{
                t(form.eligibility.eligible ? 'closings.eligible' : 'closings.blocked')
            }}</AppStatusBadge>
            <p class="text-sm text-muted">
                {{ t('closings.evaluatedAt', { date: form.eligibility.evaluatedAt }) }}
            </p>
            <ul v-if="form.eligibility.reasons.length" class="list-disc space-y-2 pl-5">
                <li v-for="reason in form.eligibility.reasons" :key="reason">
                    {{ t('closings.reasons.' + reason) }}
                </li>
            </ul>
            <dl class="grid gap-5 border-y border-line py-5 sm:grid-cols-2 xl:grid-cols-4">
                <div v-for="(quantity, kind) in form.eligibility.quantities" :key="kind">
                    <dt class="text-sm text-muted">{{ t('closings.quantities.' + kind) }}</dt>
                    <dd class="mt-1 text-lg font-semibold tabular-nums">
                        {{ t('closings.quantity', { count: quantity }) }}
                    </dd>
                </div>
            </dl>
            <p>{{ t('closings.openWork', { count: form.eligibility.openWorkCount }) }}</p>
            <div class="grid gap-4 lg:grid-cols-2">
                <InvoiceBalancePanel
                    v-for="direction in ['receivable', 'payable'] as const"
                    :key="direction"
                    :direction="direction"
                    :balance="form.eligibility.summary[direction]"
                />
            </div>
        </AppPanel>
        <AppPanel :title="t('closings.notes')">
            <AppTextarea
                id="closing-notes"
                :label="t('closings.notes')"
                :model-value="form.draft.notes ?? ''"
                :disabled="form.pending || form.uncertain || !form.permitted"
                :error="form.errors.notes ? t(form.errors.notes) : ''"
                @update:model-value="setNotes"
            />
        </AppPanel>
        <p v-if="form.error" role="alert">{{ t(form.error) }}</p>
        <p v-if="form.uncertain" role="status">{{ t('closings.uncertain') }}</p>
        <div class="wf-form-actions">
            <AppButton
                variant="secondary"
                :pending="form.refreshing"
                :disabled="form.pending || form.uncertain"
                @click="form.refresh"
                >{{ t('closings.refreshEligibility') }}</AppButton
            >
            <AppButton
                type="submit"
                :pending="form.pending"
                :disabled="
                    !form.permitted ||
                    form.refreshing ||
                    (!form.uncertain && !form.eligibility.eligible)
                "
            >
                {{ t(form.uncertain ? 'closings.retryWrite' : 'closings.request') }}
            </AppButton>
            <RouterLink
                :to="{ name: 'closings', query: { purchaseOrderId: eligibility.purchaseOrderId } }"
                class="secondary-button"
                >{{ t('closings.history') }}</RouterLink
            >
        </div>
    </form>
    <AppConfirmDialog
        :open="confirmingRequest"
        :title="t('closings.confirmTitle')"
        :description="t('closings.requestDescription')"
        @confirm="submit"
        @cancel="confirmingRequest = false"
    />
    <AppConfirmDialog
        :open="discard.confirming"
        :title="t('closings.discardTitle')"
        :description="t('closings.discardDescription')"
        @confirm="discard.confirm"
        @cancel="discard.cancel"
    />
</template>
