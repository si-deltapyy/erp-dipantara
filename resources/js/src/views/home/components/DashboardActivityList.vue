<script setup lang="ts">
import DashboardTransactionList from './DashboardTransactionList.vue'
import { useI18n } from 'vue-i18n'
import type { DashboardActivity } from '@/core/types/dashboard-activity'
defineProps<{ activity: readonly DashboardActivity[] }>()
const { t } = useI18n()
</script>
<template>
    <section class="panel" aria-labelledby="dashboard-activity-title">
        <h2 id="dashboard-activity-title" class="text-lg font-bold">
            {{ t('dashboard.activityTitle') }}
        </h2>
        <p class="mt-2 text-sm text-muted">{{ t('dashboard.activityDescription') }}</p>
        <p v-if="!activity.length" role="status" class="mt-5">{{ t('dashboard.activityEmpty') }}</p>
        <DashboardTransactionList v-else :records="activity" />
    </section>
</template>
