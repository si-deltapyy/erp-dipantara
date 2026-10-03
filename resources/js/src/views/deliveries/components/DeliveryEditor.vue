<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { DeliveryCreateInput } from '@/core/types/delivery'
import { useSessionStore } from '@/stores/session'
import { useDeliveryForm } from '../composables/useDeliveryForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import PurchaseOrderLookup from '@/views/purchase-orders/components/PurchaseOrderLookup.vue'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
import { deliveryRecordStatuses } from '@/core/types/delivery'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t, te } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useSessionStore()
const formElement = ref<HTMLFormElement>()
const saved = ref(false)
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useDeliveryForm(() => {
    saved.value = true
    void router.replace({
        name: 'deliveries',
        query: route.query,
    })
})
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !saved.value && permitted.value && store.status === 'authenticated' && dirty.value,
    () => !saved.value && store.status === 'authenticated' && pending.value,
)
async function submit(): Promise<void> {
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
function message(field: keyof DeliveryCreateInput): string | undefined {
    const error = errors.value[field]
    return error && te(error) ? t(error) : error
}
const statusOptions = computed(() =>
    deliveryRecordStatuses.map((value) => ({ value, label: t(`deliveries.statuses.${value}`) })),
)
function selectStatus(value: string): void {
    const status = deliveryRecordStatuses.find((status) => status === value)
    if (status) draft.value = { ...draft.value, status }
}
</script>
<template>
    <form ref="formElement" class="panel space-y-6" novalidate @submit.prevent="submit">
        <PurchaseOrderLookup
            id="delivery-po"
            :model-value="draft.purchaseOrderId"
            :label="t('deliveries.number')"
            :error="message('purchaseOrderId')"
            :disabled="pending || uncertain || !permitted"
            :name="'purchaseOrderId'"
            @update:model-value="draft = { ...draft, purchaseOrderId: $event }"
        />
        <div class="grid gap-5 sm:grid-cols-2">
            <MasterLookup
                v-for="kind in ['mitra', 'grader'] as const"
                :id="`delivery-${kind}`"
                :key="kind"
                :kind="kind"
                :label="t(`deliveries.${kind}`)"
                :model-value="draft[kind === 'mitra' ? 'mitraId' : 'graderId']"
                :error="message(kind === 'mitra' ? 'mitraId' : 'graderId')"
                :disabled="pending || uncertain || !permitted"
                :name="kind === 'mitra' ? 'mitraId' : 'graderId'"
                @update:model-value="
                    draft = { ...draft, [kind === 'mitra' ? 'mitraId' : 'graderId']: $event }
                "
            />
            <AppTextInput
                id="delivery-date"
                type="date"
                :label="t('deliveries.deliveryDate')"
                :model-value="draft.deliveryDate"
                :error="message('deliveryDate')"
                :disabled="pending || uncertain || !permitted"
                required
                :name="'deliveryDate'"
                @update:model-value="draft = { ...draft, deliveryDate: $event }"
            />
            <AppTextInput
                v-for="field in ['licensePlate', 'buyerSakrNumber', 'companySakrNumber'] as const"
                :id="`delivery-${field}`"
                :key="field"
                :label="t(`deliveries.${field}`)"
                :model-value="draft[field]"
                :error="message(field)"
                :disabled="pending || uncertain || !permitted"
                :maxlength="255"
                :hint="field === 'licensePlate' ? t('ui.validation.plate') : undefined"
                required
                :name="field"
                @update:model-value="draft = { ...draft, [field]: $event }"
            />
            <AppSelect
                id="delivery-status"
                renderer="nice"
                :label="t('deliveries.status')"
                :model-value="draft.status"
                :options="statusOptions"
                :error="message('status')"
                :disabled="pending || uncertain || !permitted"
                :name="'status'"
                @update:model-value="selectStatus"
            />
        </div>
        <AppTextarea
            id="delivery-notes"
            :model-value="draft.notes ?? ''"
            :label="t('deliveries.notes')"
            :maxlength="255"
            :error="message('notes')"
            :disabled="pending || uncertain || !permitted"
            :name="'notes'"
            @update:model-value="draft = { ...draft, notes: $event }"
        />
        <div
            v-if="error"
            role="alert"
            class="rounded-md border border-danger/20 bg-danger-light p-4 text-sm text-danger"
        >
            <p>{{ t(error) }}</p>
            <p v-if="error === 'deliveries.errors.conflict'">
                {{ t('deliveries.conflictHint') }}
            </p>
            <p v-if="uncertain">{{ t('deliveries.uncertain') }}</p>
        </div>
        <div class="wf-form-actions">
            <RouterLink
                :to="{
                    name: 'deliveries',
                    query: $route.query,
                }"
                class="secondary-button"
                >{{ t('deliveries.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted || uncertain">{{
                t('deliveries.save')
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
