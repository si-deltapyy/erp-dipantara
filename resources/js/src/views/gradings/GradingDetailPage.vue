<script setup lang="ts">
import { computed, reactive } from 'vue'
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
const submission = reactive(useGradingSubmit(grading))
const editable = computed(
    () => !!grading.value && canActOnGrading(session.user, grading.value, 'update'),
)
useUnsavedChanges(
    () => false,
    () => session.status === 'authenticated' && submission.pending,
)
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
