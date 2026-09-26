<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import { useSessionStore } from '@/stores/session'
import { usePurchaseOrderForm } from '../composables/usePurchaseOrderForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import PurchaseOrderFields from './PurchaseOrderFields.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ order?: PurchaseOrder }>()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useSessionStore()
const formElement = ref<HTMLFormElement>()
const saved = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = usePurchaseOrderForm(
    props.order,
    (order) => {
        saved.value = true
        void router.replace({
            name: 'purchase-order-detail',
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
        <PurchaseOrderFields
            v-model="draft"
            :errors="errors"
            :disabled="pending || uncertain || !permitted"
            :buyer-name="order?.buyerName"
            :timber-names="order?.lines.map((line) => line.timberProductName)"
        />
        <div
            v-if="error"
            role="alert"
            class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
            <p>{{ t(error) }}</p>
            <p v-if="error === 'purchase-orders.errors.conflict'">
                {{ t('purchase-orders.conflictHint') }}
            </p>
            <p v-if="uncertain">{{ t('purchase-orders.uncertain') }}</p>
        </div>
        <div class="flex flex-wrap justify-end gap-3">
            <RouterLink
                :to="{
                    name: order ? 'purchase-order-detail' : 'purchase-orders',
                    params: order ? { id: order.id } : {},
                    query: $route.query,
                }"
                class="secondary-button"
                >{{ t('purchase-orders.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'purchase-orders.retryWrite' : 'purchase-orders.save')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('purchase-orders.discardTitle')"
        :description="t('purchase-orders.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
