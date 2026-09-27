<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useAssignmentApi } from '@/views/orders/composables/useAssignmentApi'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const {
    record: assignment,
    loading,
    error,
    refresh,
} = useRecordDetail(useAssignmentApi(), 'assignments')
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ t('assignments.detailTitle') }}</h1>
            <RouterLink :to="{ name: 'assignments' }" class="secondary-button">{{
                t('assignments.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('assignments.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-4">
            <p class="text-red-700">{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <article v-else-if="assignment" class="panel space-y-5">
            <h2 class="text-xl font-bold">{{ assignment.purchaseOrderNumber }}</h2>
            <dl class="grid gap-5 sm:grid-cols-2">
                <div>
                    <dt class="text-muted">{{ t('assignments.mitra') }}</dt>
                    <dd>{{ assignment.mitraName }}</dd>
                </div>
                <div>
                    <dt class="text-muted">{{ t('assignments.grader') }}</dt>
                    <dd>{{ assignment.graderName }}</dd>
                </div>
                <div>
                    <dt class="text-muted">{{ t('assignments.timber') }}</dt>
                    <dd>{{ assignment.timberProductName }}</dd>
                </div>
                <div>
                    <dt class="text-muted">{{ t('assignments.quantity') }}</dt>
                    <dd>{{ assignment.quantity }}</dd>
                </div>
                <div>
                    <dt class="text-muted">{{ t('assignments.orderStatus') }}</dt>
                    <dd>{{ t('orders.statuses.' + assignment.orderStatus) }}</dd>
                </div>
                <div>
                    <dt class="text-muted">{{ t('assignments.grades') }}</dt>
                    <dd>{{ assignment.gradingReference.gradeCodes.join(', ') }}</dd>
                </div>
            </dl>
        </article>
    </section>
</template>
