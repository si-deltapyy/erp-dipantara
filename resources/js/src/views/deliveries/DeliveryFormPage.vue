<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnDelivery, canCreateDelivery } from '@/core/domain/delivery-policy'
import { useDeliveryDetail } from './composables/useDeliveryDetail'
import DeliveryEditor from './components/DeliveryEditor.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const { delivery, loading, error, refresh } = useDeliveryDetail()
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(() =>
    editing.value
        ? !!delivery.value && canActOnDelivery(session.user, delivery.value, 'update')
        : canCreateDelivery(session.user),
)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader
            :title="t(editing ? 'deliveries.edit' : 'deliveries.add')"
            :description="t('deliveries.subtitle')"
        />
        <AppState v-if="loading" kind="loading" :message="t('deliveries.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <DeliveryEditor v-else-if="permitted" :key="delivery?.id ?? 'new'" :delivery="delivery" />
        <p v-else role="alert" class="panel">{{ t('deliveries.locked') }}</p>
    </section>
</template>
