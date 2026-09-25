<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Buyer } from '@/core/types/buyer'
import { useSessionStore } from '@/stores/session'
import { useBuyerRecoveryStore } from '@/stores/buyer-recovery'
import { useBuyerList } from './composables/useBuyerList'
import BuyerEditor from './components/BuyerEditor.vue'
import BuyerTable from './components/BuyerTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const session = useSessionStore()
const recovery = useBuyerRecoveryStore()
const { response, query, search, loading, error, canCreate, refresh, searchBuyers, changePage } =
    useBuyerList()
const canUpdate = computed(() => !!session.user?.permissions.includes('buyers.update.all'))
const recovered = recovery.snapshot?.actorId === session.user?.id ? recovery.snapshot : null
const editing = ref(!!recovered)
const selected = shallowRef<Buyer | undefined>(recovered?.buyer)
const success = ref(false)
function open(buyer?: Buyer): void {
    selected.value = buyer
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
                <p class="mb-1 text-sm font-semibold text-primary">{{ t('buyers.section') }}</p>
                <h1 class="text-2xl font-bold tracking-tight">{{ t('buyers.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('buyers.subtitle') }}</p>
            </div>
            <AppButton v-if="canCreate" @click="open()">{{ t('buyers.add') }}</AppButton>
        </header>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('buyers.saved') }}
        </p>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchBuyers">
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="buyer-search"
                        v-model="search"
                        :label="t('buyers.search')"
                        :placeholder="t('buyers.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('buyers.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('buyers.refresh')
                }}</AppButton>
            </form>
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold">{{ t('buyers.list') }}</h2>
                <p v-if="response" class="text-sm text-muted">
                    {{ t('buyers.total', { count: response.meta.total }) }}
                </p>
            </div>
            <p v-if="error" role="alert" class="text-sm text-red-700">{{ t(error) }}</p>
            <BuyerTable
                :buyers="response?.data ?? []"
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
        <BuyerEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :buyer="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
