<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { useI18n } from 'vue-i18n'
import type { ReportKind } from '@/core/types/report-export'
import AppButton from '@/components/ui/AppButton.vue'
import { useReportExport } from '../composables/useReportExport'
const props = defineProps<{ kind: ReportKind }>()
const { t } = useI18n()
const { allowed, pending, error, hasDocument, generate, download } = useReportExport(
    () => props.kind,
)
</script>
<template>
    <AppPanel
        v-if="allowed"
        :title="t('reports.export')"
        :description="t('reports.appliedFiltersHint')"
        class="space-y-4 break-words"
    >
        <p class="text-sm text-muted">{{ t('reports.exportNotice') }}</p>
        <div class="flex flex-wrap gap-3">
            <AppButton :pending="pending" @click="generate">{{ t('reports.export') }}</AppButton>
            <AppButton
                v-if="hasDocument"
                variant="secondary"
                :disabled="pending"
                @click="download"
                >{{ t('reports.download') }}</AppButton
            >
        </div>
        <p v-if="error" role="alert">{{ t(error) }}</p>
    </AppPanel>
</template>
