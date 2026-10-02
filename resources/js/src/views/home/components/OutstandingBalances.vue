<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardBalance } from '@/core/types/dashboard-overview'
import { formatMoney } from '@/core/formatting/money'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ balances: readonly DashboardBalance[] }>()
const { t } = useI18n()
</script>

<template>
    <AppPanel
        :title="t('overview.balances')"
        :description="t('overview.balancesDescription')"
        class="wf-balances"
    >
        <div class="wf-balances-body">
            <div
                v-for="balance in balances"
                :key="balance.direction"
                class="wf-balance"
                :class="`wf-balance--${balance.direction}`"
            >
                <div class="wf-balance-label">
                    <span>{{ t(`overview.${balance.direction}`) }}</span
                    ><AppIcon
                        :name="balance.direction === 'receivable' ? 'arrow-down' : 'arrow-up'"
                        :size="18"
                    />
                </div>
                <strong>{{ formatMoney(balance.amount) }}</strong>
                <p>{{ t('overview.invoices', { count: balance.invoiceCount }) }}</p>
                <div class="wf-balance-due">
                    <AppIcon name="clock" :size="14" /><span>{{
                        t('overview.overdueBalance', { amount: formatMoney(balance.overdueAmount) })
                    }}</span>
                </div>
            </div>
        </div>
        <template #footer
            ><AppIcon name="wallet" :size="15" /><span>{{
                t('overview.balanceNote')
            }}</span></template
        >
    </AppPanel>
</template>
