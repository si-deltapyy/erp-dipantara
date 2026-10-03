<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
defineProps<{ kind: 'loading' | 'empty' | 'error'; message?: string }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>
<template>
    <div
        class="wf-state space-y-4 p-6 text-center"
        :role="kind === 'error' ? 'alert' : 'status'"
        :aria-busy="kind === 'loading' || undefined"
    >
        <span class="wf-state-icon"
            ><AppIcon
                :name="kind === 'loading' ? 'clock' : kind === 'error' ? 'link' : 'document'"
                :size="28"
        /></span>
        <p class="text-sm text-muted">{{ message || t('ui.' + kind) }}</p>
        <AppButton v-if="kind === 'error'" variant="secondary" @click="$emit('retry')">{{
            t('ui.retry')
        }}</AppButton>
    </div>
</template>
