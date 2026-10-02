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
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
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
        <AppPageHeader :title="t('buyers.title')" :description="t('buyers.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" @click="open()">{{
                    t('buyers.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('buyers.saved') }}
        </p>
        <AppPanel :title="t('buyers.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('buyers.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchBuyers"
            >
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

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <BuyerTable
                :buyers="response?.data ?? []"
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
        <BuyerEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :buyer="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
