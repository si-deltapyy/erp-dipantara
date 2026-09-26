<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BankAccountInput } from '@/core/types/bank-account'
import type { BankAccountErrors } from '@/core/domain/bank-account-validation'
import { parseBankAccountOwnerType } from '@/api/bank-account-mapper'
import { useBankAccountOwners } from '../composables/useBankAccountOwners'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
    modelValue: BankAccountInput
    errors: BankAccountErrors
    disabled: boolean
    editing: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: BankAccountInput] }>()
const { t, te } = useI18n()
const selectedLabel = ref('')
const { search, page, total, loading, error, choices, hasNext, refresh, find, changePage } =
    useBankAccountOwners(
        () => props.modelValue,
        () => props.editing,
    )
const types = computed(() =>
    ['company', 'buyer', 'mitra'].map((value) => ({ value, label: t(`bank-accounts.${value}`) })),
)
const options = computed(() => {
    const current = props.modelValue.ownerId
    const missing = current && !choices.value.some((choice) => choice.value === current)
    return [
        { value: '', label: t('bank-accounts.chooseOwner') },
        ...(missing ? [{ value: current, label: selectedLabel.value || current }] : []),
        ...choices.value,
    ]
})
function changeType(value: string): void {
    selectedLabel.value = ''
    emit('update:modelValue', {
        ...props.modelValue,
        ownerType: parseBankAccountOwnerType(value),
        ownerId: null,
    })
}
function changeOwner(value: string): void {
    selectedLabel.value = choices.value.find((choice) => choice.value === value)?.label ?? ''
    emit('update:modelValue', { ...props.modelValue, ownerId: value || null })
}
function fieldError(field: 'ownerType' | 'ownerId'): string | undefined {
    const message = props.errors[field]
    return message ? (te(message) ? t(message) : message) : undefined
}
</script>
<template>
    <div class="space-y-3">
        <AppSelect
            id="bank-account-owner-type"
            :label="t('bank-accounts.ownerType')"
            :options="types"
            :model-value="modelValue.ownerType"
            :disabled="disabled || editing"
            :error="fieldError('ownerType')"
            @update:model-value="changeType"
        />
        <p v-if="editing" class="text-sm text-muted">{{ t('bank-accounts.ownerImmutable') }}</p>
        <template v-if="modelValue.ownerType !== 'company'">
            <div v-if="!editing" class="flex items-end gap-2">
                <AppTextInput
                    id="bank-account-owner-search"
                    v-model="search"
                    :label="t('bank-accounts.ownerSearch')"
                    :placeholder="t('bank-accounts.ownerSearchHint')"
                    :maxlength="200"
                    :disabled="disabled"
                    class="min-w-0 flex-1"
                    @keydown.enter.prevent="find"
                />
                <AppButton
                    variant="secondary"
                    :disabled="disabled"
                    :pending="loading"
                    @click="find"
                    >{{ t('bank-accounts.searchAction') }}</AppButton
                >
            </div>
            <AppSelect
                id="bank-account-owner"
                :model-value="modelValue.ownerId ?? ''"
                :label="t('bank-accounts.ownerId')"
                :options="options"
                :disabled="disabled || editing || loading"
                :error="fieldError('ownerId')"
                @update:model-value="changeOwner"
            />
            <p v-if="loading" role="status" class="text-sm text-muted">
                {{ t('bank-accounts.ownerLoading') }}
            </p>
            <div v-else-if="error" role="alert" class="space-y-2 text-sm text-red-700">
                <p>{{ t(error) }}</p>
                <AppButton variant="secondary" :disabled="disabled" @click="refresh">{{
                    t('bank-accounts.refresh')
                }}</AppButton>
            </div>
            <template v-else-if="!editing">
                <p v-if="!total" role="status" class="text-sm text-muted">
                    {{ t('bank-accounts.ownerEmpty') }}
                </p>
                <div class="flex flex-wrap items-center gap-2">
                    <AppButton
                        variant="secondary"
                        :disabled="disabled || page <= 1"
                        @click="changePage(page - 1)"
                        >{{ t('bank-accounts.previous') }}</AppButton
                    >
                    <span class="text-sm text-muted">{{
                        t('bank-accounts.ownerPage', { page })
                    }}</span>
                    <AppButton
                        variant="secondary"
                        :disabled="disabled || !hasNext"
                        @click="changePage(page + 1)"
                        >{{ t('bank-accounts.next') }}</AppButton
                    >
                </div>
            </template>
        </template>
    </div>
</template>
