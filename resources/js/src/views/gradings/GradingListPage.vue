<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useGradingApi } from './composables/useGradingApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(useGradingApi(), 'gradings')
</script>
<template>
    <section class="space-y-6">
        <h1 class="text-2xl font-bold">{{ t('gradings.title') }}</h1>
        <form class="panel flex flex-wrap items-end gap-4" @submit.prevent="searchRecords">
            <AppTextInput
                id="grading-search"
                v-model="search"
                :label="t('gradings.search')"
                :maxlength="200"
            />
            <AppButton type="submit">{{ t('gradings.apply') }}</AppButton
            ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                t('gradings.refresh')
            }}</AppButton>
        </form>
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <p v-else-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
        <template v-else-if="response">
            <p>{{ t('gradings.total', { count: response.meta.total }) }}</p>
            <p v-if="!response.data.length" role="status">{{ t('gradings.empty') }}</p>
            <div class="grid gap-4 md:grid-cols-2">
                <article v-for="grading in response.data" :key="grading.id" class="panel space-y-3">
                    <h2 class="font-bold">{{ grading.purchaseOrderNumber }}</h2>
                    <p>{{ grading.mitraName }} / {{ grading.graderName }}</p>
                    <p>
                        {{ grading.gradingDate }} / {{ t('gradings.statuses.' + grading.status) }}
                    </p>
                    <p>{{ t('gradings.totalVolume') }}: {{ grading.totalVolumeM3 }}</p>
                    <RouterLink
                        :to="{ name: 'grading-detail', params: { id: grading.id } }"
                        class="secondary-button"
                        >{{ t('gradings.open') }}</RouterLink
                    >
                </article>
            </div>
            <AppPagination
                :page="query.page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                @update:page="changePage"
            />
        </template>
    </section>
</template>
