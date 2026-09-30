<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GraderDashboard } from '@/core/types/production'
import ProductionTable from '@/views/reports/components/ProductionTable.vue'
defineProps<{ snapshot: GraderDashboard }>()
const { t } = useI18n()
</script>
<template>
    <section class="space-y-5" aria-labelledby="grader-summary-title">
        <div class="panel space-y-5">
            <h2 id="grader-summary-title" class="text-lg font-bold">
                {{ t('production.assignmentsTitle') }}
            </h2>
            <p class="text-sm text-muted">{{ t('production.assignmentScope') }}</p>
            <dl class="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <div
                    v-for="key in [
                        'count',
                        'assignedQuantity',
                        'approvedQuantity',
                        'remainingQuantity',
                    ] as const"
                    :key="key"
                >
                    <dt class="text-sm text-muted">{{ t('production.assignments.' + key) }}</dt>
                    <dd class="mt-2 text-2xl font-bold">
                        {{ snapshot.assignments[key].toLocaleString('id-ID') }}
                    </dd>
                </div>
            </dl>
            <RouterLink :to="snapshot.assignments.targetPath" class="secondary-button">{{
                t('production.openAssignments')
            }}</RouterLink>
        </div>
        <div class="panel space-y-4">
            <h2 class="text-lg font-bold">
                {{ t('production.title') }} &middot; {{ snapshot.period }}
            </h2>
            <p class="text-sm text-muted">{{ t('production.simulation') }}</p>
            <ProductionTable :rows="snapshot.production" />
        </div>
    </section>
</template>
