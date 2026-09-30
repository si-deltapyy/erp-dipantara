<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { Order } from '@/core/types/order'
import { useSessionStore } from '@/stores/session'
import { useOrderForm } from '../composables/useOrderForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import ApprovedPurchaseOrderLookup from './ApprovedPurchaseOrderLookup.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ order?: Order }>()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useSessionStore()
const formElement = ref<HTMLFormElement>()
const saved = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useOrderForm(
    props.order,
    (order) => {
        saved.value = true
        void router.replace({
            name: 'order-detail',
            params: { id: order.id },
            query: route.query,
        })
    },
)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !saved.value && permitted.value && store.status === 'authenticated' && dirty.value,
    () => !saved.value && store.status === 'authenticated' && pending.value,
)
async function submit(): Promise<void> {
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <form ref="formElement" class="panel space-y-6" novalidate @submit.prevent="submit">
        <ApprovedPurchaseOrderLookup
            v-if="!order"
            id="order-po"
            :model-value="draft.purchaseOrderId"
            :label="t('orders.number')"
            :error="errors.purchaseOrderId ? t(errors.purchaseOrderId) : ''"
            :disabled="pending || uncertain || !permitted"
            @update:model-value="draft = { ...draft, purchaseOrderId: $event }"
        />
        <p v-else>{{ t('orders.number') }}: {{ order.purchaseOrderNumber }}</p>
        <AppTextInput
            id="order-notes"
            :model-value="draft.notes ?? ''"
            :label="t('orders.notes')"
            :maxlength="2000"
            :error="errors.notes ? t(errors.notes) : ''"
            :disabled="pending || uncertain || !permitted"
            @update:model-value="draft = { ...draft, notes: $event || null }"
        />
        <div
            v-if="error"
            role="alert"
            class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
            <p>{{ t(error) }}</p>
            <p v-if="error === 'orders.errors.conflict'">
                {{ t('orders.conflictHint') }}
            </p>
            <p v-if="uncertain">{{ t('orders.uncertain') }}</p>
        </div>
        <div class="flex flex-wrap justify-end gap-3">
            <RouterLink
                :to="{
                    name: order ? 'order-detail' : 'orders',
                    params: order ? { id: order.id } : {},
                    query: $route.query,
                }"
                class="secondary-button"
                >{{ t('orders.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'orders.retryWrite' : 'orders.save')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('orders.discardTitle')"
        :description="t('orders.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
