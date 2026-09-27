<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useGradingReview } from './composables/useGradingReview'
import AppReviewDialog from '@/components/ui/AppReviewDialog.vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { useGradingDetail } from './composables/useGradingDetail'
import { useGradingSubmit } from './composables/useGradingSubmit'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import GradingMeasurements from './components/GradingMeasurements.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const session = useSessionStore()
const { grading, loading, error, refresh } = useGradingDetail()
const route = useRoute()
const review = reactive(useGradingReview(grading, refresh, () => route.params.id))
const submission = reactive(useGradingSubmit(grading))
const editable = computed(
    () => !!grading.value && canActOnGrading(session.user, grading.value, 'update'),
)
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!review.reason.trim(),
        () => session.status === 'authenticated' && (submission.pending || review.pending),
    ),
)
function closeReview(): void {
    discard.requestDiscard(() => review.close())
}
</script>
<template>
    <section class="mx-auto max-w-5xl space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-2xl font-bold">{{ t('gradings.detail') }}</h1>
            <RouterLink :to="{ name: 'gradings' }" class="secondary-button">{{
                t('gradings.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <template v-else-if="grading">
            <div class="panel space-y-4">
                <h2 class="text-xl font-semibold">{{ grading.purchaseOrderNumber }}</h2>
                <p>{{ grading.mitraName }} / {{ grading.graderName }}</p>
                <p>{{ t('gradings.statuses.' + grading.status) }}</p>
                <p v-if="grading.rejectionReason">
                    {{ t('gradings.rejectionReason') }}: {{ grading.rejectionReason }}
                </p>
                <div class="flex flex-wrap gap-3">
                    <AppButton
                        v-if="review.canApprove"
                        :disabled="review.pending"
                        @click="review.open('approve')"
                        >{{ t('gradings.approve') }}</AppButton
                    >
                    <AppButton
                        v-if="review.canReject"
                        variant="secondary"
                        :disabled="review.pending"
                        @click="review.open('reject')"
                        >{{ t('gradings.reject') }}</AppButton
                    >
                </div>
                <GradingMeasurements :grading="grading" />
                <div class="flex flex-wrap gap-3">
                    <RouterLink
                        v-if="editable && !submission.pending && !submission.uncertain"
                        :to="{ name: 'grading-edit', params: { id: grading.id } }"
                        class="primary-button"
                        >{{ t('gradings.edit') }}</RouterLink
                    >
                    <RouterLink
                        :to="{ name: 'assignment-detail', params: { id: grading.assignmentId } }"
                        class="secondary-button"
                        >{{ t('gradings.assignment') }}</RouterLink
                    >
                    <AppButton
                        v-if="submission.canSubmit"
                        :pending="submission.pending"
                        @click="submission.confirming = true"
                        >{{
                            t(submission.uncertain ? 'gradings.retryWrite' : 'gradings.submit')
                        }}</AppButton
                    >
                </div>
            </div>
            <div v-if="submission.error" role="alert" class="panel space-y-3">
                <p>{{ t(submission.error) }}</p>
                <p v-if="submission.uncertain">{{ t('gradings.uncertain') }}</p>
                <AppButton v-else @click="refresh">{{ t('gradings.refresh') }}</AppButton>
            </div>
        </template>
        <div v-if="review.error && !review.action" class="panel space-y-3" role="alert">
            <p>{{ t(review.error) }}</p>
            <AppButton @click="review.reload">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <AppReviewDialog
            v-model:reason="review.reason"
            resource="gradings"
            reason-id="grading-rejection-reason"
            :action="review.action"
            :reason-error="review.reasonError"
            :error="review.error"
            :pending="review.pending"
            :uncertain="review.uncertain"
            :blocked="review.blocked"
            @close="closeReview"
            @confirm="review.submit"
            @reload="review.reload"
        />
        <AppConfirmDialog
            :open="discard.confirming"
            :title="t('gradings.discardTitle')"
            :description="t('gradings.discardDescription')"
            @confirm="discard.confirm"
            @cancel="discard.cancel"
        />
        <AppConfirmDialog
            :open="submission.confirming"
            :title="t('gradings.submit')"
            :description="t('gradings.submitDescription')"
            :pending="submission.pending"
            @confirm="submission.submit"
            @cancel="submission.confirming = false"
        />
    </section>
</template>
