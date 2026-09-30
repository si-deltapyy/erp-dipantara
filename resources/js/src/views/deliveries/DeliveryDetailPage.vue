<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnDelivery } from '@/core/domain/delivery-policy'
import { useDeliveryDetail } from './composables/useDeliveryDetail'
import DeliveryDocuments from './components/DeliveryDocuments.vue'
import DeliveryTransitions from './components/DeliveryTransitions.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const locked = ref(false)
const session = useSessionStore()
const { delivery, loading, error, refresh } = useDeliveryDetail()
const canEdit = computed(
    () => !!delivery.value && canActOnDelivery(session.user, delivery.value, 'update'),
)
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-bold">{{ t('deliveries.detail') }}</h1>
            <RouterLink :to="{ name: 'deliveries' }" class="secondary-button">{{
                t('deliveries.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('deliveries.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('deliveries.refresh') }}</AppButton>
        </div>
        <template v-else-if="delivery">
            <div class="panel space-y-4">
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.number') }}</dt>
                        <dd class="font-semibold">{{ delivery.purchaseOrderNumber }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.buyer') }}</dt>
                        <dd>{{ delivery.buyerName }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.licensePlate') }}</dt>
                        <dd>{{ delivery.licensePlate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.deliveryDate') }}</dt>
                        <dd>{{ delivery.deliveryDate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('deliveries.status') }}</dt>
                        <dd>{{ t('deliveries.statuses.' + delivery.status) }}</dd>
                    </div>
                </dl>
                <RouterLink
                    v-if="canEdit && !locked"
                    :to="{ name: 'delivery-edit', params: { id: delivery.id } }"
                    class="primary-button"
                    >{{ t('deliveries.edit') }}</RouterLink
                >
            </div>
            <div class="panel overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <caption class="pb-4 text-left text-lg font-semibold">
                        {{
                            t('deliveries.allocation')
                        }}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col" class="p-3">{{ t('deliveries.timber') }}</th>
                            <th scope="col" class="p-3">{{ t('deliveries.mitra') }}</th>
                            <th scope="col" class="p-3">{{ t('deliveries.quantity') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="row in delivery.allocationContext"
                            :key="row.gradingId + ':' + row.rowId"
                            class="border-t border-line"
                        >
                            <td class="min-w-40 p-3">{{ row.timberProductName }}</td>
                            <td class="min-w-36 p-3">{{ row.mitraName }}</td>
                            <td class="p-3">{{ row.quantity }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <DeliveryDocuments :delivery="delivery" :locked="locked" />
            <DeliveryTransitions
                :delivery="delivery"
                @changed="delivery = $event"
                @locked="locked = $event"
            />
        </template>
    </section>
</template>
