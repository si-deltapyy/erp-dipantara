<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { Invoice } from '@/core/types/invoice'
import { sumMoney } from '@/core/domain/money-arithmetic'
import { formatMoney } from '@/core/formatting/money'
import { useInvoiceRevision } from '../composables/useInvoiceRevision'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useSessionStore } from '@/stores/session'
import InvoiceTerms from './InvoiceTerms.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ invoice: Invoice }>()
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const completed = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useInvoiceRevision(
    props.invoice,
    (invoice) => {
        completed.value = true
        void router.replace({ name: 'invoice-detail', params: { id: invoice.id } })
    },
)
const total = computed(() =>
    draft.value.terms.every((term) => /^\d+\.\d{2}$/.test(term.amount))
        ? sumMoney(draft.value.terms.map((term) => term.amount))
        : null,
)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !completed.value && session.status === 'authenticated' && dirty.value,
    () => !completed.value && session.status === 'authenticated' && pending.value,
)
</script>
<template>
    <form class="min-w-0 space-y-6" @submit.prevent="save">
        <AppPanel
            :title="t('invoices.revisionComparison')"
            :description="t('invoices.revisionHint')"
        >
            <dl class="grid gap-4 sm:grid-cols-2">
                <div>
                    <dt>{{ t('invoices.previousTotal') }}</dt>
                    <dd class="mt-2 break-words text-xl font-semibold tabular-nums">
                        {{ formatMoney(invoice.totalAmount) }}
                    </dd>
                </div>
                <div>
                    <dt>{{ t('invoices.proposedTotal') }}</dt>
                    <dd class="mt-2 break-words text-xl font-semibold tabular-nums">
                        {{ total ? formatMoney(total) : t('invoices.invalidTerms') }}
                    </dd>
                </div>
            </dl></AppPanel
        >
        <InvoiceTerms
            :terms="draft.terms"
            :errors="errors"
            :disabled="pending || uncertain || !permitted"
            @change="draft = { ...draft, terms: $event }"
        />
        <AppPanel :title="t('invoices.revisionReason')">
            <AppTextInput
                id="invoice-reason"
                :label="t('invoices.revisionReason')"
                :model-value="draft.reason"
                :maxlength="255"
                :disabled="pending || uncertain || !permitted"
                :error="errors.reason ? t(errors.reason) : ''"
                name="reason"
                @update:model-value="draft = { ...draft, reason: $event }"
            />
        </AppPanel>
        <p v-if="error" role="alert">{{ t(error) }}</p>
        <p v-if="uncertain" role="status">{{ t('invoices.uncertain') }}</p>
        <div class="wf-form-actions">
            <RouterLink
                :to="{ name: 'invoice-detail', params: { id: invoice.id } }"
                class="secondary-button"
                >{{ t('invoices.cancel') }}</RouterLink
            ><AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'invoices.retryWrite' : 'invoices.saveRevision')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('invoices.discardTitle')"
        :description="t('invoices.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
