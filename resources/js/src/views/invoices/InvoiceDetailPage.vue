<script setup lang="ts">
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
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-bold">{{ t('invoices.detail') }}</h1>
            <RouterLink :to="{ name: 'invoices', query: $route.query }" class="secondary-button">{{
                t('invoices.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <template v-else-if="invoice">
            <div class="panel space-y-4">
                <h2 class="break-words text-xl font-semibold">
                    {{ invoice.number ?? t('invoices.statuses.draft') }}
                </h2>
                <dl class="grid gap-4 sm:grid-cols-2">
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
                        <dd>{{ t('invoices.statuses.' + invoice.status) }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.totalAmount') }}</dt>
                        <dd class="font-bold">{{ formatMoney(invoice.totalAmount) }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('invoices.outstandingAmount') }}</dt>
                        <dd>{{ formatMoney(invoice.outstandingAmount) }}</dd>
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
            </div>
            <section class="panel space-y-3">
                <h2 class="text-lg font-semibold">{{ t('invoices.terms') }}</h2>
                <dl
                    v-for="(term, index) in invoice.terms"
                    :key="index"
                    class="grid gap-2 border-t border-line pt-3 sm:grid-cols-3"
                >
                    <dt class="font-semibold">{{ term.label }}</dt>
                    <dd>{{ formatMoney(term.amount) }}</dd>
                    <dd>{{ term.dueDate ?? t('invoices.noDueDate') }}</dd>
                </dl>
            </section>
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
            <RouterLink
                v-if="canActOnInvoice(session.user, invoice, 'revise')"
                :to="{ name: 'invoice-revise', params: { id: invoice.id } }"
                class="secondary-button"
                >{{ t('invoices.revise') }}</RouterLink
            >
            <RouterLink
                v-if="
                    invoice.issuedRevisionNumber &&
                    evaluateRecordAccess(session.user, 'payments.create', invoice) === 'allowed'
                "
                :to="{ name: 'payment-new', query: { invoiceId: invoice.id } }"
                class="primary-button"
                >{{ t('payments.start') }}</RouterLink
            >
            <RouterLink
                v-if="evaluateRecordAccess(session.user, 'payments.read', invoice) === 'allowed'"
                :to="{ name: 'payments', query: { invoiceId: invoice.id } }"
                class="secondary-button"
                >{{ t('payments.monitor') }}</RouterLink
            >
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
