<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMitraList } from './composables/useMitraList'
import MitraTable from './components/MitraTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchMitras, changePage } =
    useMitraList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('mitras.title')" :description="t('mitras.subtitle')">
            <template #actions
                ><AppButton disabled :title="t('ui.writeUnavailable')">{{
                    t('mitras.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.writeUnavailable') }}</p>
        <AppPanel :title="t('mitras.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('mitras.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchMitras"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="mitra-search"
                        v-model="search"
                        :label="t('mitras.search')"
                        :placeholder="t('mitras.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('mitras.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('mitras.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <MitraTable
                :mitras="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
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
    </section>
</template>
