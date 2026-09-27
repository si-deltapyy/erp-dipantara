<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
defineProps<{ grading: Grading }>()
const { t } = useI18n()
</script>
<template>
    <div class="space-y-4">
        <p>{{ t('gradings.gradingDate') }}: {{ grading.gradingDate }}</p>
        <article
            v-for="(row, index) in grading.rows"
            :key="row.rowId"
            class="rounded-md border border-slate-200 p-4"
        >
            <h3 class="font-semibold">
                {{ t('gradings.line', { number: index + 1 }) }} /
                {{
                    grading.rowResults.find((result) => result.rowId === row.rowId)
                        ?.timberProductName
                }}
            </h3>
            <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                    <dt class="text-sm text-muted">{{ t('gradings.quantity') }}</dt>
                    <dd>{{ row.quantity }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-muted">{{ t('gradings.diameter') }}</dt>
                    <dd>{{ row.diameterCm }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-muted">{{ t('gradings.length') }}</dt>
                    <dd>{{ row.lengthM }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-muted">{{ t('gradings.grade') }}</dt>
                    <dd>{{ row.gradeCode }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-muted">{{ t('gradings.volume') }}</dt>
                    <dd>
                        {{
                            grading.rowResults.find((result) => result.rowId === row.rowId)
                                ?.volumeM3
                        }}
                    </dd>
                </div>
            </dl>
        </article>
        <p class="font-bold">{{ t('gradings.totalVolume') }}: {{ grading.totalVolumeM3 }}</p>
    </div>
</template>
