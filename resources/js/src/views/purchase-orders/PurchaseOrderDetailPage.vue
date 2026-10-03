<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderDetail } from './composables/usePurchaseOrderDetail'
import { formatPurchaseOrderMoney } from './purchase-order-format'
import PurchaseOrderStatus from './components/PurchaseOrderStatus.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import AppTable from '@/components/ui/AppTable.vue'
import type { TableColumn } from '@/core/types/table'
import type { PurchaseOrderDetail } from '@/core/types/purchase-order'
const { t } = useI18n()
const session = useSessionStore()
const { order, loading, error, refresh } = usePurchaseOrderDetail()
const canEdit = computed(() =>
    [
        'purchase-orders.update.all',
        'buyers.read.all',
        'timber-products.read.all',
        'timber-prices.read.all',
    ].every((permission) => session.user?.permissions.includes(permission)),
)
const columns = computed<readonly TableColumn<PurchaseOrderDetail['orders'][number]>[]>(() => [
    { key: 'number', label: t('orders.number') },
    { key: 'mitraName', label: t('mitras.name') },
    { key: 'graderGroup', label: t('graders.graderGroup') },
])
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('purchase-orders.detail')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'purchase-orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('purchase-orders.back') }}</RouterLink
                ><RouterLink
                    v-if="order && canEdit"
                    :to="{
                        name: 'purchase-order-edit',
                        params: { id: order.id },
                        query: $route.query,
                    }"
                    class="primary-button"
                    >{{ t('purchase-orders.edit') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="order">
            <AppPanel :title="order.number"
                ><template #actions><PurchaseOrderStatus :status="order.status" /></template>
                <dl class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="field in [
                            'buyerName',
                            'productName',
                            'orderDate',
                            'closingDate',
                            'quantity',
                        ] as const"
                        :key="field"
                    >
                        <dt class="text-sm text-muted">
                            {{ t(`purchase-orders.detailFields.${field}`) }}
                        </dt>
                        <dd class="break-words font-semibold">
                            {{ order[field] ?? t('ui.unavailableValue') }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.totalAmount') }}</dt>
                        <dd class="font-semibold">
                            {{
                                order.totalAmount === null
                                    ? t('ui.unavailableValue')
                                    : formatPurchaseOrderMoney(order.totalAmount)
                            }}
                        </dd>
                    </div>
                    <div class="sm:col-span-2">
                        <dt class="text-sm text-muted">{{ t('purchase-orders.notes') }}</dt>
                        <dd class="whitespace-pre-wrap break-words">
                            {{ order.notes || t('ui.unavailableValue') }}
                        </dd>
                    </div>
                </dl>
            </AppPanel>
            <AppPanel :title="t('orders.title')"
                ><AppTable
                    :rows="order.orders"
                    :columns="columns"
                    :row-key="(entry) => entry.id"
                    :caption="t('orders.title')"
            /></AppPanel>
            <p class="text-sm text-muted">{{ t('purchase-orders.workflowUnavailable') }}</p>
        </template>
    </section>
</template>
