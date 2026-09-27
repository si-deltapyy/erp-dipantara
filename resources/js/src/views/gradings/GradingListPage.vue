<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { gradingStatuses } from '@/core/types/grading'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useGradingList } from './composables/useGradingList'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const {
    response,
    query,
    search,
    loading,
    error,
    refresh,
    applyFilters,
    changePage,
    status,
    assignmentId,
    canReview,
} = useGradingList()
</script>
<template>
    <section class="space-y-6">
        <h1 class="text-2xl font-bold">{{ t('gradings.title') }}</h1>
        <RouterLink
            v-if="canReview"
            :to="{
                name: 'gradings',
                query: { ...$route.query, status: 'submitted', page: undefined },
            }"
            class="secondary-button"
            >{{ t('gradings.reviewQueue') }}</RouterLink
        >
        <form class="panel flex flex-wrap items-end gap-4" @submit.prevent="applyFilters">
            <AppTextInput
                id="grading-search"
                v-model="search"
                :label="t('gradings.search')"
                :maxlength="200"
            />
            <AppSelect
                id="grading-status"
                v-model="status"
                :label="t('gradings.status')"
                :options="[
                    { value: '', label: t('gradings.allStatuses') },
                    ...gradingStatuses.map((status) => ({
                        value: status,
                        label: t('gradings.statuses.' + status),
                    })),
                ]"
            />
            <AppTextInput
                id="grading-assignment"
                v-model="assignmentId"
                :label="t('gradings.assignmentFilter')"
                :maxlength="100"
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
