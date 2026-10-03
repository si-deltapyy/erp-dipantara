<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrderDetail } from './composables/useOrderDetail'
import PurchaseOrderStatus from '@/views/purchase-orders/components/PurchaseOrderStatus.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const { order, loading, error, refresh } = useOrderDetail()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('orders.detail')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('orders.back') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="order">
            <AppPanel :title="order.number">
                <dl class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="field in [
                            'purchaseOrderNumber',
                            'buyerName',
                            'orderDate',
                            'mitraName',
                            'graderName',
                            'buyerGraderName',
                            'buyerGraderPhone',
                            'notes',
                        ] as const"
                        :key="field"
                    >
                        <dt class="text-sm text-muted">{{ t(`orders.detailFields.${field}`) }}</dt>
                        <dd class="whitespace-pre-wrap break-words font-semibold">
                            {{ order[field] ?? t('ui.unavailableValue') }}
                        </dd>
                    </div>
                    <div v-if="order.purchaseOrderStatus">
                        <dt class="mb-2 text-sm text-muted">{{ t('orders.parentStatus') }}</dt>
                        <dd><PurchaseOrderStatus :status="order.purchaseOrderStatus" /></dd>
                    </div>
                </dl>
            </AppPanel>
            <p class="text-sm text-muted">{{ t('orders.workflowUnavailable') }}</p>
        </template>
    </section>
</template>
