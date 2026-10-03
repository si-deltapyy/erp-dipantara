<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardWorkRow } from '@/core/types/dashboard-overview'
import { formatMoney } from '@/core/formatting/money'
import { formatVolume } from '@/core/formatting/volume'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

defineProps<{ work: DashboardWorkRow | null; notice?: string }>()
defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
    <AppDrawer :open="work !== null" :title="t('overview.details')" @close="$emit('close')">
        <div v-if="work" class="wf-work-detail">
            <AppStatusBadge>{{ t(`overview.${work.status}`) }}</AppStatusBadge>
            <h3>{{ work.id }}</h3>
            <p>{{ work.buyer }}</p>
            <dl>
                <div>
                    <dt>{{ t('overview.material') }}</dt>
                    <dd>{{ work.timber }}</dd>
                </div>
                <div>
                    <dt>{{ t('overview.volume') }}</dt>
                    <dd>{{ formatVolume(work.volume) }} m³</dd>
                </div>
                <div>
                    <dt>{{ t('overview.amount') }}</dt>
                    <dd>{{ formatMoney(work.amount) }}</dd>
                </div>
                <div>
                    <dt>{{ t('overview.dueDate') }}</dt>
                    <dd>{{ work.dueDate }}</dd>
                </div>
            </dl>
            <p v-if="notice" class="wf-detail-notice">{{ notice }}</p>
            <AppButton variant="secondary" @click="$emit('close')">{{
                t('overview.close')
            }}</AppButton>
        </div>
    </AppDrawer>
</template>
