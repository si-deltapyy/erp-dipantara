<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'
defineProps<{ kind: 'loading' | 'empty' | 'error'; message?: string }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>
<template>
    <div
        class="space-y-4 rounded-md border border-line bg-white p-6 text-center"
        :role="kind === 'error' ? 'alert' : 'status'"
        :aria-busy="kind === 'loading' || undefined"
    >
        <p class="text-sm text-muted">{{ message || t('ui.' + kind) }}</p>
        <AppButton v-if="kind === 'error'" variant="secondary" @click="$emit('retry')">{{
            t('ui.retry')
        }}</AppButton>
    </div>
</template>
