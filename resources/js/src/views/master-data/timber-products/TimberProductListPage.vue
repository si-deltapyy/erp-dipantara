<script setup lang="ts">
import { computed } from 'vue'
import { canReadPrices } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useI18n } from 'vue-i18n'
import { useTimberProductList } from './composables/useTimberProductList'
import TimberProductTable from './components/TimberProductTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const session = useSessionStore()
const canReadPrice = computed(() => canReadPrices(session.user))
const { response, query, search, loading, error, refresh, searchTimberProducts, changePage } =
    useTimberProductList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader
            :title="t('timber-products.title')"
            :description="t('timber-products.subtitle')"
        >
            <template #actions
                ><AppButton disabled :title="t('ui.writeUnavailable')">{{
                    t('timber-products.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.writeUnavailable') }}</p>
        <p class="text-sm text-muted">{{ t('timber-products.unitsUnconfirmed') }}</p>
        <AppPanel :title="t('timber-products.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('timber-products.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchTimberProducts"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="timber-product-search"
                        v-model="search"
                        :label="t('timber-products.search')"
                        :placeholder="t('timber-products.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('timber-products.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('timber-products.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <TimberProductTable
                :can-read-prices="canReadPrice"
                :timber-products="response?.data ?? []"
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
