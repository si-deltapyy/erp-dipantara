<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BankAccount } from '@/core/types/bank-account'
import { useSessionStore } from '@/stores/session'
import { useBankAccountRecoveryStore } from '@/stores/bank-account-recovery'
import { useBankAccountList } from './composables/useBankAccountList'
import BankAccountEditor from './components/BankAccountEditor.vue'
import BankAccountTable from './components/BankAccountTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const session = useSessionStore()
const recovery = useBankAccountRecoveryStore()
const {
    response,
    query,
    search,
    loading,
    error,
    canCreate,
    refresh,
    searchBankAccounts,
    changePage,
} = useBankAccountList()
const canUpdate = computed(() => !!session.user?.permissions.includes('bank-accounts.update.all'))
const recovered = recovery.snapshot?.actorId === session.user?.id ? recovery.snapshot : null
const editing = ref(!!recovered)
const selected = shallowRef<BankAccount | undefined>(recovered?.bankAccount)
const success = ref(false)
function open(bankAccount?: BankAccount): void {
    selected.value = bankAccount
    success.value = false
    editing.value = true
}
function saved(): void {
    editing.value = false
    selected.value = undefined
    success.value = true
    void refresh()
}
function close(): void {
    editing.value = false
    selected.value = undefined
    recovery.$reset()
}
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('bank-accounts.title')" :description="t('bank-accounts.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" @click="open()">{{
                    t('bank-accounts.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('bank-accounts.saved') }}
        </p>
        <AppPanel :title="t('bank-accounts.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('bank-accounts.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchBankAccounts"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="bankAccount-search"
                        v-model="search"
                        :label="t('bank-accounts.search')"
                        :placeholder="t('bank-accounts.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('bank-accounts.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('bank-accounts.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <BankAccountTable
                :bank-accounts="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                :can-update="canUpdate"
                @edit="open"
                @retry="refresh"
            />
            <template #footer
                ><AppPagination
                    v-if="response && !error"
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    :disabled="loading"
                    @update:page="changePage"
            /></template>
        </AppPanel>
        <BankAccountEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :bank-account="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
