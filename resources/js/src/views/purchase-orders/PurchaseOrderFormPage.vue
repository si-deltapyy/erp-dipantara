<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnPurchaseOrder, canCreatePurchaseOrder } from '@/core/domain/purchase-order-policy'
import { usePurchaseOrderDetail } from './composables/usePurchaseOrderDetail'
import PurchaseOrderEditor from './components/PurchaseOrderEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const { order, loading, error, refresh } = usePurchaseOrderDetail()
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(() =>
    editing.value
        ? !!order.value && canActOnPurchaseOrder(session.user, order.value, 'update')
        : canCreatePurchaseOrder(session.user),
)
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">
            {{ t(editing ? 'purchase-orders.edit' : 'purchase-orders.add') }}
        </h1>
        <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('purchase-orders.refresh') }}</AppButton>
        </div>
        <PurchaseOrderEditor v-else-if="permitted" :key="order?.id ?? 'new'" :order="order" />
        <p v-else role="alert" class="panel">{{ t('purchase-orders.locked') }}</p>
    </section>
</template>
