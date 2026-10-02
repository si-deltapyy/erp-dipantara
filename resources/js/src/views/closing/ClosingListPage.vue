<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useClosingApi } from './composables/useClosingApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const route = useRoute()
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(useClosingApi(), 'closings', () => ({
        purchaseOrderId:
            typeof route.query.purchaseOrderId === 'string'
                ? route.query.purchaseOrderId
                : undefined,
        status: typeof route.query.status === 'string' ? route.query.status : undefined,
    }))
</script>
<template>
    <section class="space-y-6">
        <h1 class="text-2xl font-bold">{{ t('closings.title') }}</h1>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-48 flex-1">
                    <AppTextInput
                        id="closing-search"
                        v-model="search"
                        :label="t('closings.search')"
                    />
                </div>
                <AppButton type="submit">{{ t('closings.searchAction') }}</AppButton>
                <AppButton variant="secondary" @click="refresh">{{
                    t('closings.refresh')
                }}</AppButton>
            </form>
            <p v-if="loading" role="status">{{ t('closings.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response">
                <p>{{ t('closings.total', { count: response.meta.total }) }}</p>
                <p v-if="!response.data.length">{{ t('closings.empty') }}</p>
                <ul class="divide-y divide-line">
                    <li v-for="closing in response.data" :key="closing.id" class="space-y-2 py-4">
                        <RouterLink
                            :to="{
                                name: 'closing-detail',
                                params: { id: closing.id },
                                query: $route.query,
                            }"
                            class="break-words font-semibold text-primary underline"
                            >{{ closing.purchaseOrderNumber }}</RouterLink
                        >
                        <p>{{ t('closings.statuses.' + closing.status) }}</p>
                        <p class="break-words text-sm text-muted">
                            {{ closing.notes ?? t('closings.noNotes') }}
                        </p>
                    </li>
                </ul>
                <AppPagination
                    :page="query.page"
                    :page-size="query.perPage"
                    :total="response.meta.total"
                    :disabled="loading"
                    @update:page="changePage"
                />
            </template>
        </div>
    </section>
</template>
