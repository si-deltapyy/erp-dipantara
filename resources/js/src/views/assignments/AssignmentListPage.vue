<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useAssignmentApi } from '@/views/orders/composables/useAssignmentApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(useAssignmentApi(), 'assignments')
</script>
<template>
    <section class="space-y-6">
        <header>
            <h1 class="text-2xl font-bold">{{ t('assignments.assignedTitle') }}</h1>
            <p class="mt-2 text-muted">{{ t('assignments.assignedHint') }}</p>
        </header>
        <form class="panel flex flex-wrap items-end gap-4" @submit.prevent="searchRecords">
            <AppTextInput
                id="assignment-search"
                v-model="search"
                :label="t('orders.search')"
                :maxlength="200"
            />
            <AppButton type="submit">{{ t('orders.apply') }}</AppButton>
            <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                t('orders.refresh')
            }}</AppButton>
        </form>
        <p v-if="loading" role="status">{{ t('assignments.loading') }}</p>
        <p v-else-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
        <template v-else-if="response">
            <p>{{ t('orders.total', { count: response.meta.total }) }}</p>
            <p v-if="!response.data.length" role="status">{{ t('assignments.empty') }}</p>
            <div class="grid gap-4 md:grid-cols-2">
                <article
                    v-for="assignment in response.data"
                    :key="assignment.id"
                    class="panel space-y-3"
                >
                    <h2 class="font-bold">{{ assignment.purchaseOrderNumber }}</h2>
                    <p>{{ assignment.mitraName }} / {{ assignment.graderName }}</p>
                    <p>
                        {{ assignment.timberProductName }} /
                        {{ t('orders.quantityValue', { count: assignment.quantity }) }}
                    </p>
                    <p>{{ t('orders.statuses.' + assignment.orderStatus) }}</p>
                    <RouterLink
                        :to="{ name: 'assignment-detail', params: { id: assignment.id } }"
                        class="secondary-button"
                        >{{ t('assignments.open') }}</RouterLink
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
