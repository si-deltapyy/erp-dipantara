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
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="mb-1 text-sm font-semibold text-primary">
                    {{ t('bank-accounts.section') }}
                </p>
                <h1 class="text-2xl font-bold tracking-tight">{{ t('bank-accounts.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('bank-accounts.subtitle') }}</p>
            </div>
            <AppButton v-if="canCreate" @click="open()">{{ t('bank-accounts.add') }}</AppButton>
        </header>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('bank-accounts.saved') }}
        </p>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchBankAccounts">
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
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold">{{ t('bank-accounts.list') }}</h2>
                <p v-if="response" class="text-sm text-muted">
                    {{ t('bank-accounts.total', { count: response.meta.total }) }}
                </p>
            </div>
            <p v-if="error" role="alert" class="text-sm text-red-700">{{ t(error) }}</p>
            <BankAccountTable
                :bank-accounts="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                :can-update="canUpdate"
                @edit="open"
                @retry="refresh"
            />
            <AppPagination
                v-if="response && !error"
                :page="query.page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                :disabled="loading"
                @update:page="changePage"
            />
        </div>
        <BankAccountEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :bank-account="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
