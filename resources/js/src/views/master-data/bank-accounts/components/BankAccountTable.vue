<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BankAccountRecord } from '@/core/types/bank-account'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{
    bankAccounts: readonly BankAccountRecord[]
    state: 'ready' | 'loading' | 'error'
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<BankAccountRecord>[]>(() => [
    { key: 'bankName', label: t('bank-accounts.bankName') },
    { key: 'accountNumber', label: t('bank-accounts.accountNumber') },
    { key: 'accountHolder', label: t('bank-accounts.accountHolder') },
    { key: 'source', label: t('bank-accounts.source') },
    { key: 'mitraId', label: t('bank-accounts.mitraReference') },
])
</script>
<template>
    <AppTable
        :rows="bankAccounts"
        :columns="columns"
        :row-key="(account) => `${account.source}:${account.id}`"
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
        <template #cell-source="{ row }">{{ t('bank-accounts.sources.' + row.source) }}</template>
        <template #cell-mitraId="{ row }">{{ row.mitraId ?? '—' }}</template>
    </AppTable>
</template>
