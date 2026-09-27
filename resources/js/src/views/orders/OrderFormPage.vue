<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnOrder, canCreateOrder } from '@/core/domain/order-policy'
import { useOrderDetail } from './composables/useOrderDetail'
import OrderEditor from './components/OrderEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const { order, loading, error, refresh } = useOrderDetail()
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(() =>
    editing.value
        ? !!order.value && canActOnOrder(session.user, order.value, 'update')
        : canCreateOrder(session.user),
)
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">
            {{ t(editing ? 'orders.edit' : 'orders.add') }}
        </h1>
        <p v-if="loading" role="status">{{ t('orders.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <OrderEditor v-else-if="permitted" :key="order?.id ?? 'new'" :order="order" />
        <p v-else role="alert" class="panel">{{ t('orders.locked') }}</p>
    </section>
</template>
