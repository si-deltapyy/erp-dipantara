<script setup lang="ts">
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
    <form class="panel space-y-5" @submit.prevent="save">
        <p>{{ t('invoices.revisionHint') }}</p>
        <dl class="grid gap-4 sm:grid-cols-2">
            <div>
                <dt>{{ t('invoices.previousTotal') }}</dt>
                <dd class="font-bold">{{ formatMoney(invoice.totalAmount) }}</dd>
            </div>
            <div>
                <dt>{{ t('invoices.proposedTotal') }}</dt>
                <dd class="font-bold">
                    {{ total ? formatMoney(total) : t('invoices.invalidTerms') }}
                </dd>
            </div>
        </dl>
        <InvoiceTerms
            :terms="draft.terms"
            :errors="errors"
            :disabled="pending || uncertain || !permitted"
            @change="draft = { ...draft, terms: $event }"
        />
        <AppTextInput
            id="invoice-reason"
            :label="t('invoices.revisionReason')"
            :model-value="draft.reason"
            :maxlength="255"
            :disabled="pending || uncertain || !permitted"
            :error="errors.reason ? t(errors.reason) : ''"
            @update:model-value="draft = { ...draft, reason: $event }"
        />
        <p v-if="error" role="alert">{{ t(error) }}</p>
        <p v-if="uncertain" role="status">{{ t('invoices.uncertain') }}</p>
        <div class="flex flex-wrap justify-end gap-3">
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
