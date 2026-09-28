<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { Delivery, DeliveryInput } from '@/core/types/delivery'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useDeliveryForm } from '../composables/useDeliveryForm'
import { useDeliveryAvailability } from '../composables/useDeliveryAvailability'
import ApprovedPurchaseOrderLookup from '@/views/orders/components/ApprovedPurchaseOrderLookup.vue'
import DeliverySakrSelection from './DeliverySakrSelection.vue'
import DeliveryAllocationFields from './DeliveryAllocationFields.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ delivery?: Delivery }>()
const { t } = useI18n()
const router = useRouter()
const store = useSessionStore()
const formElement = ref<HTMLFormElement>()
const saved = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useDeliveryForm(
    props.delivery,
    (delivery) => {
        saved.value = true
        void router.replace({ name: 'delivery-detail', params: { id: delivery.id } })
    },
)
const {
    rows,
    loading,
    error: stockError,
    page,
    total,
    refresh,
    changePage,
} = useDeliveryAvailability(
    () => draft.value.purchaseOrderId,
    props.delivery?.id,
    (rows) => {
        if (!uncertain.value && !pending.value)
            draft.value = {
                ...draft.value,
                availabilityToken: rows[0]?.snapshotToken ?? '',
                allocations: draft.value.allocations.map((allocation) => {
                    const active = rows.find(
                        (row) =>
                            row.rowId === allocation.rowId &&
                            row.lineageIds.includes(allocation.gradingId),
                    )
                    return active ? { ...allocation, gradingId: active.gradingId } : allocation
                }),
            }
    },
)
const disabled = computed(() => pending.value || uncertain.value || !permitted.value)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !saved.value && permitted.value && store.status === 'authenticated' && dirty.value,
    () => !saved.value && store.status === 'authenticated' && pending.value,
)
function update<K extends keyof DeliveryInput>(field: K, value: DeliveryInput[K]): void {
    draft.value = { ...draft.value, [field]: value }
    errors.value = Object.fromEntries(
        Object.entries(errors.value).filter(
            ([key]) => key !== field && !key.startsWith(`${field}.`),
        ),
    )
}
function selectParent(id: string): void {
    draft.value = { ...draft.value, purchaseOrderId: id, allocations: [], availabilityToken: '' }
    errors.value = {}
}
async function submit(): Promise<void> {
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <form ref="formElement" class="panel space-y-6" novalidate @submit.prevent="submit">
        <ApprovedPurchaseOrderLookup
            v-if="!delivery"
            id="delivery-po"
            :model-value="draft.purchaseOrderId"
            :label="t('deliveries.number')"
            :error="errors.purchaseOrderId ? t(errors.purchaseOrderId) : ''"
            :disabled="disabled"
            @update:model-value="selectParent"
        />
        <p v-else>{{ t('deliveries.number') }}: {{ delivery.purchaseOrderNumber }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
            <AppTextInput
                id="delivery-date"
                type="date"
                :model-value="draft.deliveryDate"
                :label="t('deliveries.deliveryDate')"
                :error="errors.deliveryDate ? t(errors.deliveryDate) : ''"
                :disabled="disabled"
                @update:model-value="update('deliveryDate', $event)"
            />
            <AppTextInput
                id="delivery-plate"
                :model-value="draft.licensePlate"
                :label="t('deliveries.licensePlate')"
                :maxlength="20"
                :error="errors.licensePlate ? t(errors.licensePlate) : ''"
                :disabled="disabled"
                @update:model-value="update('licensePlate', $event)"
            />
        </div>
        <section class="space-y-4">
            <h2 class="text-lg font-semibold">{{ t('deliveries.allocation') }}</h2>
            <p class="text-sm text-muted">{{ t('deliveries.stockHint') }}</p>
            <AppButton
                variant="secondary"
                :disabled="disabled || !draft.purchaseOrderId"
                :pending="loading"
                @click="refresh"
                >{{ t('deliveries.refreshStock') }}</AppButton
            >
            <p v-if="loading" role="status">{{ t('deliveries.loading') }}</p>
            <p v-else-if="stockError" role="alert">{{ t(stockError) }}</p>
            <template v-else
                ><DeliveryAllocationFields
                    v-if="rows.length"
                    :rows="rows"
                    :allocations="draft.allocations"
                    :errors="errors"
                    :disabled="disabled"
                    @change="update('allocations', $event)"
                />
                <p v-else>{{ t('deliveries.emptyStock') }}</p></template
            >
            <AppPagination :page="page" :page-size="20" :total="total" @update:page="changePage" />
            <p class="text-sm">
                {{ t('deliveries.selected', { count: draft.allocations.length }) }}
            </p>
            <p
                v-if="errors.allocations || errors.availabilityToken"
                role="alert"
                class="text-red-700"
            >
                {{ t(errors.allocations || errors.availabilityToken || '') }}
            </p>
        </section>
        <DeliverySakrSelection
            v-if="delivery"
            :delivery-id="delivery.id"
            :documents="draft.documents"
            :disabled="disabled"
            :errors="errors"
            @change="update('documents', $event)"
        />
        <div
            v-if="error"
            role="alert"
            class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
            <p>{{ t(error) }}</p>
            <p v-if="error === 'deliveries.errors.conflict'">{{ t('deliveries.conflictHint') }}</p>
            <p v-if="uncertain">{{ t('deliveries.uncertain') }}</p>
        </div>
        <div class="flex flex-wrap justify-end gap-3">
            <RouterLink
                :to="{
                    name: delivery ? 'delivery-detail' : 'deliveries',
                    params: delivery ? { id: delivery.id } : {},
                }"
                class="secondary-button"
                >{{ t('deliveries.cancel') }}</RouterLink
            ><AppButton type="submit" :pending="pending" :disabled="!permitted || loading">{{
                t(uncertain ? 'deliveries.retryWrite' : 'deliveries.save')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('deliveries.discardTitle')"
        :description="t('deliveries.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
