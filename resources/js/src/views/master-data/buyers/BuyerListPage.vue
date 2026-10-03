<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useBuyerList } from './composables/useBuyerList'
import BuyerTable from './components/BuyerTable.vue'
import BuyerEditor from './components/BuyerEditor.vue'
import BuyerFields from './components/BuyerFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppState from '@/components/ui/AppState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const {
    response,
    query,
    search,
    loading,
    error,
    canCreate,
    refresh,
    searchBuyers,
    changePage,
    selectedId,
    detail,
} = useBuyerList()
const session = useSessionStore()
const editing = ref(false)
const {
    record: selectedBuyer,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
} = detail
const canUpdate = computed(() => !!session.user?.permissions.includes('buyers.update.all'))
const success = ref(false)
function open(): void {
    selectedId.value = undefined
    success.value = false
    editing.value = true
}
function saved(): void {
    editing.value = false
    selectedId.value = undefined
    success.value = true
    void refresh()
}
watch(
    () => session.user,
    () => {
        editing.value = false
        selectedId.value = undefined
        success.value = false
    },
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('buyers.title')" :description="t('buyers.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" @click="open">{{
                    t('buyers.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p v-if="success" role="status" class="text-sm text-primary">{{ t('buyers.saved') }}</p>
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
                @retry="refresh"
                @select="selectedId = $event"
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
        <AppModal
            :open="!!selectedId && !editing"
            :title="t('buyers.detail')"
            @close="selectedId = undefined"
        >
            <AppState v-if="detailLoading" kind="loading" />
            <AppState
                v-else-if="detailError"
                kind="error"
                :message="t(detailError)"
                @retry="refreshDetail"
            />
            <template v-else-if="selectedBuyer">
                <BuyerFields :model-value="selectedBuyer" :errors="{}" disabled />
                <div class="wf-form-actions">
                    <AppButton v-if="canUpdate" @click="editing = true">{{
                        t('buyers.edit')
                    }}</AppButton>
                </div>
            </template>
        </AppModal>
        <BuyerEditor
            v-if="editing && (selectedBuyer ? canUpdate : canCreate)"
            :buyer="selectedBuyer"
            @close="editing = false"
            @saved="saved"
        />
    </section>
</template>
