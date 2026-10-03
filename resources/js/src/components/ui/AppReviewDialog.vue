<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ReviewAction } from '@/core/types/workflow'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
defineProps<{
    resource: string
    reasonId: string
    action?: ReviewAction
    reason: string
    reasonError: string
    error: string
    pending: boolean
    uncertain: boolean
    blocked: boolean
}>()
defineEmits<{ 'update:reason': [reason: string]; close: []; confirm: []; reload: [] }>()
const { t } = useI18n()
</script>
<template>
    <AppModal
        :open="!!action"
        :title="t(resource + '.' + (action || 'approve'))"
        :busy="pending || uncertain"
        :initial-focus="action === 'reject' ? '#' + reasonId : '[data-review-cancel]'"
        @close="$emit('close')"
    >
        <div class="space-y-4">
            <p>
                {{
                    t(
                        resource +
                            '.' +
                            (action === 'reject' ? 'rejectDescription' : 'approveDescription'),
                    )
                }}
            </p>
            <AppTextarea
                v-if="action === 'reject'"
                :id="reasonId"
                :maxlength="2000"
                :model-value="reason"
                :label="t(resource + '.reason')"
                :error="reasonError ? t(reasonError) : undefined"
                :disabled="pending || uncertain"
                @update:model-value="$emit('update:reason', $event)"
            />
            <p v-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
            <p v-if="uncertain" role="status">{{ t(resource + '.uncertain') }}</p>
            <p v-if="blocked">{{ t(resource + '.reviewConflict') }}</p>
        </div>
        <template #footer>
            <AppButton
                data-review-cancel
                variant="secondary"
                :disabled="pending || uncertain"
                @click="$emit('close')"
                >{{ t('ui.cancel') }}</AppButton
            >
            <AppButton
                v-if="blocked || uncertain"
                variant="secondary"
                :disabled="pending"
                @click="$emit('reload')"
                >{{ t(resource + '.refresh') }}</AppButton
            >
            <AppButton :pending="pending" :disabled="blocked" @click="$emit('confirm')">{{
                t(uncertain ? resource + '.retryWrite' : 'ui.confirm')
            }}</AppButton>
        </template>
    </AppModal>
</template>
