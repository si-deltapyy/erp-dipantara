<script setup lang="ts">
import { integrationPermissions } from '@/core/constants/business-permissions'
import { canAccess } from '@/core/domain/access-policy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderDetail } from './composables/usePurchaseOrderDetail'
import PurchaseOrderEditor from './components/PurchaseOrderEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const { order, loading, error, refresh } = usePurchaseOrderDetail()
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(
    () =>
        canAccess(
            session.user,
            integrationPermissions[
                editing.value ? 'purchase-orders.update' : 'purchase-orders.create'
            ],
        ) &&
        (!editing.value || !!order.value),
)
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <AppPageHeader :title="t(editing ? 'purchase-orders.edit' : 'purchase-orders.add')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'purchase-orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('purchase-orders.back') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('purchase-orders.refresh') }}</AppButton>
        </div>
        <PurchaseOrderEditor v-else-if="permitted" :key="order?.id ?? 'new'" :order="order" />
        <p v-else role="alert" class="panel">{{ t('purchase-orders.locked') }}</p>
    </section>
</template>
