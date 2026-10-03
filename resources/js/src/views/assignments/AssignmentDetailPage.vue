<script setup lang="ts">
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useAssignmentApi } from '@/views/orders/composables/useAssignmentApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import OrderStatus from '@/views/orders/components/OrderStatus.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    record: assignment,
    loading,
    error,
    refresh,
} = useRecordDetail(useAssignmentApi(), 'assignments')
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('assignments.detailTitle')">
            <template #actions>
                <RouterLink :to="{ name: 'assignments' }" class="secondary-button">{{
                    t('assignments.back')
                }}</RouterLink>
            </template>
        </AppPageHeader>
        <p v-if="loading" role="status">{{ t('assignments.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-4">
            <p class="text-danger">{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <article v-else-if="assignment" class="panel space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <h2 class="break-words text-xl font-semibold">
                    {{ assignment.purchaseOrderNumber }}
                </h2>
                <OrderStatus :status="assignment.orderStatus" />
            </div>
            <dl
                class="grid gap-6 border-y border-line py-6 sm:grid-cols-2 xl:grid-cols-3 [&_dd]:mt-1 [&_dd]:break-words [&_dd]:font-semibold"
            >
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
                    <dd class="text-2xl">{{ assignment.quantity.toLocaleString('id-ID') }}</dd>
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
            <RouterLink
                v-if="
                    evaluateRecordAccess(session.user, 'deliveries.read', assignment) === 'allowed'
                "
                :to="{ name: 'deliveries', query: { assignmentId: assignment.id } }"
                class="secondary-button"
                >{{ t('deliveries.monitor') }}</RouterLink
            >
            <RouterLink
                v-if="
                    assignment.allowedActions.includes('create-grading') &&
                    evaluateRecordAccess(session.user, 'gradings.create', assignment) === 'allowed'
                "
                :to="{ name: 'grading-new', query: { assignmentId: assignment.id } }"
                class="primary-button"
                >{{ t('gradings.add') }}</RouterLink
            >
        </article>
    </section>
</template>
