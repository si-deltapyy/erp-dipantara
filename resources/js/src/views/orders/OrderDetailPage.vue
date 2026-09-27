<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnOrder } from '@/core/domain/order-policy'
import { useOrderDetail } from './composables/useOrderDetail'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const session = useSessionStore()
const { order, loading, error, refresh } = useOrderDetail()
const editable = computed(() => !!order.value && canActOnOrder(session.user, order.value, 'update'))
</script>
<template>
    <section class="mx-auto max-w-5xl space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ t('orders.detail') }}</h1>
            <RouterLink :to="{ name: 'orders', query: $route.query }" class="secondary-button">{{
                t('orders.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('orders.loading') }}</p>
        <div v-else-if="error" class="panel space-y-3" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <template v-else-if="order">
            <div class="panel space-y-4">
                <h2 class="text-xl font-semibold">{{ order.purchaseOrderNumber }}</h2>
                <p>{{ order.buyerName }}</p>
                <p>{{ t('orders.statuses.' + order.status) }}</p>
                <p>{{ t('orders.dp') }}: {{ t('orders.dpUnavailable') }}</p>
                <p class="whitespace-pre-wrap break-words">{{ order.notes }}</p>
                <p v-if="order.rejectionReason">
                    {{ t('orders.rejectionReason') }}: {{ order.rejectionReason }}
                </p>
                <div class="flex flex-wrap gap-3">
                    <RouterLink
                        v-if="editable"
                        :to="{ name: 'order-edit', params: { id: order.id }, query: $route.query }"
                        class="primary-button"
                        >{{ t('orders.edit') }}</RouterLink
                    ><RouterLink
                        :to="{
                            name: 'purchase-order-detail',
                            params: { id: order.purchaseOrderId },
                        }"
                        class="secondary-button"
                        >{{ t('orders.parent') }}</RouterLink
                    >
                </div>
            </div>
        </template>
    </section>
</template>
