<script setup lang="ts">
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
        <ul v-else class="mt-4 divide-y divide-line">
            <li
                v-for="record in activity"
                :key="record.resource + ':' + record.id"
                class="grid gap-2 py-4 sm:grid-cols-[1fr_auto]"
            >
                <div class="min-w-0">
                    <p class="text-xs font-semibold text-muted">
                        {{ t('dashboard.resources.' + record.resource) }}
                    </p>
                    <RouterLink
                        :to="record.targetPath"
                        class="mt-1 block break-words font-semibold text-primary underline"
                        >{{ record.label }}</RouterLink
                    >
                    <p class="mt-1 break-words text-sm text-muted">
                        {{ record.purchaseOrderNumber }}
                    </p>
                </div>
                <div class="text-sm sm:text-right">
                    <p>{{ t('dashboard.statuses.' + record.status) }}</p>
                    <time :datetime="record.updatedAt" class="mt-1 block text-xs text-muted">{{
                        new Date(record.updatedAt).toLocaleString('id-ID')
                    }}</time>
                </div>
            </li>
        </ul>
    </section>
</template>
