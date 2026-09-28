<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnDelivery, canCreateDelivery } from '@/core/domain/delivery-policy'
import { useDeliveryDetail } from './composables/useDeliveryDetail'
import DeliveryEditor from './components/DeliveryEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
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
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">
            {{ t(editing ? 'deliveries.edit' : 'deliveries.add') }}
        </h1>
        <p v-if="loading" role="status">{{ t('deliveries.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('deliveries.refresh') }}</AppButton>
        </div>
        <DeliveryEditor v-else-if="permitted" :key="delivery?.id ?? 'new'" :delivery="delivery" />
        <p v-else role="alert" class="panel">{{ t('deliveries.locked') }}</p>
    </section>
</template>
