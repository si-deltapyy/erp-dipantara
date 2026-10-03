<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useInvoiceApi } from './composables/useInvoiceApi'
import { useInvoiceIssue } from './composables/useInvoiceIssue'
import { canActOnInvoice } from '@/core/domain/invoice-policy'
import { formatMoney } from '@/core/formatting/money'
import { useSessionStore } from '@/stores/session'
import InvoiceSettlement from './components/InvoiceSettlement.vue'
import InvoiceHistory from './components/InvoiceHistory.vue'
import InvoiceDocument from './components/InvoiceDocument.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    record: invoice,
    loading,
    error,
    refresh,
} = useRecordDetail(useInvoiceApi(), 'invoices', false)
const issue = reactive(useInvoiceIssue(invoice))
const canEdit = computed(
    () => invoice.value && canActOnInvoice(session.user, invoice.value, 'update'),
)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('invoices.detail')"
            ><template #actions>
                <RouterLink
                    :to="{ name: 'invoices', query: $route.query }"
                    class="secondary-button"
                    >{{ t('invoices.back') }}</RouterLink
                >
            </template></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" :message="t('invoices.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="invoice">
            <p
                v-if="
                    invoice.status === 'draft' &&
                    invoice.issuedRevisionNumber &&
                    invoice.issuedTotalAmount
                "
                class="panel"
                role="status"
            >
                {{
                    t('invoices.issuedActive', {
                        revision: invoice.issuedRevisionNumber,
                        amount: formatMoney(invoice.issuedTotalAmount),
                    })
                }}
                {{ t('invoices.revisionHint') }}
            </p>
            <AppPanel
                :title="invoice.number ?? t('invoices.statuses.draft')"
                class="space-y-5 break-words"
            >
                <dl class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <dt class="text-muted">{{ t('invoices.purchaseOrder') }}</dt>
                        <dd>{{ invoice.purchaseOrderNumber }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.counterparty') }}</dt>
                        <dd>{{ invoice.counterpartyName }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.direction') }}</dt>
                        <dd>{{ t('invoices.' + invoice.direction) }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.kind') }}</dt>
                        <dd>{{ t('invoices.' + invoice.kind) }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.invoiceDate') }}</dt>
                        <dd>{{ invoice.invoiceDate }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.status') }}</dt>
                        <dd>
                            <AppStatusBadge
                                :tone="invoice.status === 'issued' ? 'success' : 'neutral'"
                                >{{ t('invoices.statuses.' + invoice.status) }}</AppStatusBadge
                            >
                        </dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.totalAmount') }}</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">
                            {{ formatMoney(invoice.totalAmount) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.outstandingAmount') }}</dt>
                        <dd class="mt-1 text-xl font-semibold tabular-nums">
                            {{ formatMoney(invoice.outstandingAmount) }}
                        </dd>
                    </div>
                </dl>
                <p v-if="invoice.notes" class="whitespace-pre-wrap break-words">
                    {{ invoice.notes }}
                </p>
                <RouterLink
                    v-if="canEdit && !issue.pending && !issue.uncertain"
                    :to="{ name: 'invoice-edit', params: { id: invoice.id } }"
                    class="secondary-button"
                    >{{ t('invoices.edit') }}</RouterLink
                >
            </AppPanel>
            <AppPanel :title="t('invoices.terms')" class="space-y-4">
                <dl
                    v-for="(term, index) in invoice.terms"
                    :key="index"
                    class="grid gap-2 border-t border-line pt-3 sm:grid-cols-3"
                >
                    <dt class="font-semibold">{{ term.label }}</dt>
                    <dd>{{ formatMoney(term.amount) }}</dd>
                    <dd>{{ term.dueDate ?? t('invoices.noDueDate') }}</dd>
                </dl>
            </AppPanel>
            <div class="flex flex-wrap gap-3">
                <RouterLink
                    v-if="canActOnInvoice(session.user, invoice, 'revise')"
                    :to="{ name: 'invoice-revise', params: { id: invoice.id } }"
                    class="secondary-button"
                    >{{ t('invoices.revise') }}</RouterLink
                >
                <RouterLink
                    v-if="
                        invoice.allowedActions.includes('record-payment') &&
                        evaluateRecordAccess(session.user, 'payments.create', invoice) === 'allowed'
                    "
                    :to="{ name: 'payment-new', query: { invoiceId: invoice.id } }"
                    class="primary-button"
                    >{{ t('payments.start') }}</RouterLink
                >
                <RouterLink
                    v-if="
                        evaluateRecordAccess(session.user, 'payments.read', invoice) === 'allowed'
                    "
                    :to="{ name: 'payments', query: { invoiceId: invoice.id } }"
                    class="secondary-button"
                    >{{ t('payments.monitor') }}</RouterLink
                >
            </div>
            <InvoiceSettlement :key="invoice.version" :invoice-id="invoice.id" />
            <InvoiceDocument :invoice="invoice" />
            <InvoiceHistory
                v-if="invoice.revisionNumber > 1"
                :key="invoice.version"
                :invoice-id="invoice.id"
                :revision-number="invoice.revisionNumber"
            />
        </template>
        <p v-if="issue.error" role="alert">{{ t(issue.error) }}</p>
        <p v-if="issue.uncertain" role="status">{{ t('invoices.uncertain') }}</p>
        <AppButton
            v-if="issue.canSubmit"
            :pending="issue.pending"
            @click="issue.confirming = true"
            >{{ t(issue.uncertain ? 'invoices.retryWrite' : 'invoices.issue') }}</AppButton
        >
        <AppConfirmDialog
            :open="issue.confirming"
            :title="t('invoices.issue')"
            :description="t('invoices.issueDescription')"
            :pending="issue.pending"
            @confirm="issue.submit"
            @cancel="issue.confirming = false"
        />
    </section>
</template>
