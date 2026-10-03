<script setup lang="ts">
import GradingComparison from './components/GradingComparison.vue'
import GradingHistory from './components/GradingHistory.vue'
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
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import AppState from '@/components/ui/AppState.vue'
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
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('gradings.detail')"
            ><template #actions>
                <RouterLink :to="{ name: 'gradings' }" class="secondary-button">{{
                    t('gradings.back')
                }}</RouterLink>
            </template></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" :message="t('gradings.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="grading">
            <AppPanel :title="grading.purchaseOrderNumber" class="min-w-0">
                <div class="space-y-5 break-words">
                    <p>{{ grading.mitraName }} / {{ grading.graderName }}</p>
                    <AppStatusBadge
                        :tone="
                            grading.status === 'approved'
                                ? 'success'
                                : grading.status === 'submitted'
                                  ? 'warning'
                                  : grading.status === 'rejected'
                                    ? 'danger'
                                    : 'neutral'
                        "
                        >{{ t('gradings.statuses.' + grading.status) }}</AppStatusBadge
                    >
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
                    <p v-if="grading.revisionReason" class="whitespace-pre-wrap">
                        {{ t('gradings.revisionReason') }}: {{ grading.revisionReason }}
                    </p>
                    <p
                        v-if="
                            grading.revisionOfId &&
                            grading.status !== 'approved' &&
                            grading.status !== 'superseded'
                        "
                        class="text-sm text-muted"
                    >
                        {{ t('gradings.revisionHint') }}
                    </p>
                    <p
                        v-if="grading.invoiceRevisionRequired"
                        role="status"
                        class="rounded-md border border-line bg-canvas p-4 text-sm"
                    >
                        {{ t('gradings.invoiceRevisionRequired') }}
                    </p>

                    <div class="flex flex-wrap gap-3">
                        <RouterLink
                            v-if="
                                canActOnGrading(session.user, grading, 'revise') && !review.pending
                            "
                            :to="{ name: 'grading-revise', params: { id: grading.id } }"
                            class="primary-button"
                            >{{ t('gradings.revise') }}</RouterLink
                        >
                        <RouterLink
                            v-if="editable && !submission.pending && !submission.uncertain"
                            :to="{ name: 'grading-edit', params: { id: grading.id } }"
                            class="primary-button"
                            >{{ t('gradings.edit') }}</RouterLink
                        >
                        <RouterLink
                            :to="{
                                name: 'assignment-detail',
                                params: { id: grading.assignmentId },
                            }"
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
            </AppPanel>
            <GradingComparison v-if="grading.revisionOfId" :grading="grading" />
            <AppPanel v-else :title="t('gradings.measurements')" class="min-w-0"
                ><GradingMeasurements :grading="grading"
            /></AppPanel>
            <div v-if="submission.error" role="alert" class="panel space-y-3">
                <p>{{ t(submission.error) }}</p>
                <p v-if="submission.uncertain">{{ t('gradings.uncertain') }}</p>
                <AppButton v-else @click="refresh">{{ t('gradings.refresh') }}</AppButton>
            </div>
            <GradingHistory :key="grading.id" :grading="grading" />
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
