<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { usePurchaseOrderDetail } from './composables/usePurchaseOrderDetail'
import { usePurchaseOrderSubmit } from './composables/usePurchaseOrderSubmit'
import { formatPurchaseOrderMoney } from './purchase-order-format'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const session = useSessionStore()
const { order, loading, error, refresh } = usePurchaseOrderDetail()
const {
    pending,
    confirming,
    error: submitError,
    uncertain,
    canSubmit,
    submit,
} = usePurchaseOrderSubmit(order)
const canEdit = computed(
    () => !!order.value && canActOnPurchaseOrder(session.user, order.value, 'update'),
)
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ t('purchase-orders.detail') }}</h1>
            <RouterLink
                :to="{ name: 'purchase-orders', query: $route.query }"
                class="secondary-button"
                >{{ t('purchase-orders.back') }}</RouterLink
            >
        </header>
        <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('purchase-orders.refresh') }}</AppButton>
        </div>
        <template v-else-if="order">
            <div class="panel space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h2 class="break-words text-xl font-semibold">{{ order.number }}</h2>
                    <span
                        class="rounded-md bg-primary-light px-3 py-2 text-sm font-semibold text-primary-strong"
                        >{{ t('purchase-orders.statuses.' + order.status) }}</span
                    >
                </div>
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.buyer') }}</dt>
                        <dd class="break-words font-semibold">{{ order.buyerName }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.orderDate') }}</dt>
                        <dd>{{ order.orderDate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.totalAmount') }}</dt>
                        <dd class="break-words text-lg font-bold text-primary-strong">
                            {{ formatPurchaseOrderMoney(order.totalAmount) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.notes') }}</dt>
                        <dd class="whitespace-pre-wrap break-words">{{ order.notes || '—' }}</dd>
                    </div>
                </dl>
            </div>
            <div class="panel space-y-4">
                <h2 class="font-semibold">{{ t('purchase-orders.lines') }}</h2>
                <div
                    v-for="(line, index) in order.lines"
                    :key="index"
                    class="grid gap-2 border-b border-line pb-4 sm:grid-cols-3"
                >
                    <p class="break-words font-semibold">{{ line.timberProductName }}</p>
                    <p>{{ t('purchase-orders.quantityValue', { count: line.quantity }) }}</p>
                    <p class="break-words">{{ formatPurchaseOrderMoney(line.unitPrice) }}</p>
                </div>
            </div>
            <div v-if="submitError" role="alert" class="panel space-y-2 text-red-700">
                <p>{{ t(submitError) }}</p>
                <p v-if="uncertain">{{ t('purchase-orders.uncertain') }}</p>
                <AppButton v-if="!uncertain" variant="secondary" @click="refresh">{{
                    t('purchase-orders.refresh')
                }}</AppButton>
            </div>
            <div class="flex flex-wrap justify-end gap-3">
                <RouterLink
                    v-if="canEdit && !pending && !uncertain"
                    :to="{
                        name: 'purchase-order-edit',
                        params: { id: order.id },
                        query: $route.query,
                    }"
                    class="secondary-button"
                    >{{ t('purchase-orders.edit') }}</RouterLink
                >
                <AppButton v-if="canSubmit" :pending="pending" @click="confirming = true">{{
                    t(uncertain ? 'purchase-orders.retryWrite' : 'purchase-orders.submit')
                }}</AppButton>
            </div>
        </template>
        <AppConfirmDialog
            :open="confirming"
            :title="t('purchase-orders.submit')"
            :description="t('purchase-orders.submitDescription')"
            :pending="pending"
            @confirm="submit"
            @cancel="confirming = false"
        />
    </section>
</template>
