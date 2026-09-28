<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ProductionRow } from '@/core/types/production'
import { formatVolume } from '@/core/formatting/volume'
defineProps<{ rows: readonly ProductionRow[] }>()
const { t } = useI18n()
</script>
<template>
    <p v-if="!rows.length" role="status">{{ t('production.empty') }}</p>
    <ul v-else class="divide-y divide-line" :aria-label="t('production.summary')">
        <li
            v-for="row in rows"
            :key="row.timberProductId + ':' + row.category"
            class="grid gap-3 py-4 sm:grid-cols-3"
        >
            <div class="min-w-0">
                <p class="break-words font-semibold">{{ row.timberProductName }}</p>
                <p class="mt-1 text-sm text-muted">
                    {{ t('production.category', { category: row.category }) }}
                </p>
            </div>
            <p>{{ t('production.quantity', { count: row.quantity }) }}</p>
            <p>{{ formatVolume(row.volumeM3) }} {{ t('production.volumeUnit') }}</p>
        </li>
    </ul>
</template>
