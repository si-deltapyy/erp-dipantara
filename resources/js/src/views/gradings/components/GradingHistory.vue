<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import AppPanel from '@/components/ui/AppPanel.vue'
defineProps<{ grading: Grading }>()
const { t } = useI18n()
</script>
<template>
    <AppPanel :title="t('gradings.assignmentHistory')">
        <p role="status" class="text-sm text-muted">{{ t('ui.featureUnavailable') }}</p>
    </AppPanel>
</template>
