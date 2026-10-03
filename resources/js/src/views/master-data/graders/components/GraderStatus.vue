<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GraderProvisioningStatus } from '@/core/types/grader'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ status: GraderProvisioningStatus }>()
const { t } = useI18n()
const tones = {
    not_provisioned: 'neutral',
    pending_activation: 'warning',
    active: 'success',
} as const
</script>
<template>
    <AppStatusBadge :tone="tones[status]">{{ t('graders.' + status) }}</AppStatusBadge>
</template>
