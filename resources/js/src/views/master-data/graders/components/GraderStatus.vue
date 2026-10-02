<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GraderProvisioningStatus } from '@/core/types/grader'

defineProps<{ status: GraderProvisioningStatus }>()
const { t } = useI18n()
const colors: Record<GraderProvisioningStatus, string> = {
    not_provisioned: 'bg-slate-100 text-slate-700',
    pending_activation: 'bg-amber-50 text-amber-800',
    active: 'bg-emerald-50 text-emerald-800',
}
</script>
<template>
    <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="colors[status]"
        >{{ t('graders.' + status) }}</span
    >
</template>
