<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useI18n } from 'vue-i18n'
import { useGradingList } from './composables/useGradingList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import GradingTable from './components/GradingTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const session = useSessionStore()
const canCreate = computed(() =>
    [
        'gradings.read.all',
        'gradings.create.all',
        'purchase-orders.read.all',
        'mitras.read.all',
        'graders.read.all',
        'timber-products.read.all',
        'timber-prices.read.all',
    ].every((permission) => session.user?.permissions.includes(permission)),
)
const { response, search, searchRecords, loading, error, refresh, changePage } = useGradingList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('gradings.title')">
            <template #actions
                ><RouterLink
                    v-if="canCreate"
                    :to="{ name: 'grading-new' }"
                    class="primary-button"
                    >{{ t('gradings.add') }}</RouterLink
                ></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('gradings.basicOnly') }}</p>
        <AppPanel :title="t('gradings.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('gradings.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="grading-search"
                    v-model="search"
                    :label="t('gradings.search')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('gradings.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <GradingTable v-else-if="response" :gradings="response.data" />
            <template #footer>
                <AppPagination
                    v-if="response && !error"
                    numbered
                    :disabled="loading"
                    :page="response.meta.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </AppPanel>
    </section>
</template>
