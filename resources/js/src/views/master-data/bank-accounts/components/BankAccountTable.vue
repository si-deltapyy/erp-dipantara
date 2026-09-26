<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BankAccount } from '@/core/types/bank-account'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps<{
    bankAccounts: readonly BankAccount[]
    state: 'ready' | 'loading' | 'error'
    canUpdate: boolean
}>()
defineEmits<{ edit: [bankAccount: BankAccount]; retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<BankAccount>[]>(() => [
    { key: 'bankName', label: t('bank-accounts.bankName') },
    { key: 'accountNumber', label: t('bank-accounts.accountNumber') },
    { key: 'accountHolder', label: t('bank-accounts.accountHolder') },
    { key: 'ownerType', label: t('bank-accounts.ownerType') },
    { key: 'allowedActions', label: t('bank-accounts.actions') },
])
</script>
<template>
    <AppTable
        :rows="bankAccounts"
        :columns="columns"
        :row-key="(account) => account.id"
        :caption="t('bank-accounts.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-bankName="{ row }"
            ><span class="block min-w-32 max-w-56 whitespace-normal break-words font-semibold">{{
                row.bankName
            }}</span></template
        >
        <template #cell-accountNumber="{ row }"
            ><span class="block max-w-56 whitespace-normal break-all">{{
                row.accountNumber
            }}</span></template
        >
        <template #cell-accountHolder="{ row }"
            ><span class="block min-w-32 max-w-56 whitespace-normal break-words">{{
                row.accountHolder
            }}</span></template
        >
        <template #cell-ownerType="{ row }">{{ t('bank-accounts.' + row.ownerType) }}</template>
        <template #cell-allowedActions="{ row }"
            ><AppButton
                v-if="canUpdate && row.allowedActions.includes('update')"
                variant="secondary"
                :aria-label="t('bank-accounts.edit') + ': ' + row.bankName"
                @click="$emit('edit', row)"
                >{{ t('bank-accounts.edit') }}</AppButton
            ><span v-else>—</span></template
        >
    </AppTable>
</template>
