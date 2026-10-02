<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { productionCategories } from '@/core/types/production'
import { reportRouteQuery } from '../composables/report-route-query'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const period = ref('')
const search = ref('')
const category = ref('')
const buyerId = ref('')
const mitraId = ref('')
const graderId = ref('')
const timberProductId = ref('')
watch(
    () => route.query,
    () => {
        const query = reportRouteQuery(route.query)
        period.value = query.period
        search.value = typeof route.query.search === 'string' ? route.query.search : ''
        category.value = query.category ?? ''
        buyerId.value = query.buyerId ?? ''
        mitraId.value = query.mitraId ?? ''
        graderId.value = query.graderId ?? ''
        timberProductId.value = query.timberProductId ?? ''
    },
    { immediate: true },
)
async function apply(): Promise<void> {
    await router.replace({
        query: {
            period: period.value,
            search: search.value || undefined,
            category: category.value || undefined,
            buyerId: buyerId.value || undefined,
            mitraId: mitraId.value || undefined,
            graderId: graderId.value || undefined,
            timberProductId: timberProductId.value || undefined,
        },
    })
}
</script>
<template>
    <form class="space-y-4" @submit.prevent="apply">
        <div class="grid gap-4 md:grid-cols-2">
            <AppTextInput
                id="report-period"
                v-model="period"
                type="month"
                :label="t('production.period')"
            />
            <AppTextInput
                id="report-search"
                v-model="search"
                :label="t('reports.search')"
                :maxlength="200"
            />
            <AppSelect
                id="report-category"
                v-model="category"
                :label="t('reports.category')"
                :options="[
                    { value: '', label: t('reports.all') },
                    ...productionCategories.map((value) => ({ value, label: value })),
                ]"
            />
            <MasterLookup
                v-if="hasBusinessPermission(session.user, 'buyers.lookup')"
                id="report-buyer"
                v-model="buyerId"
                kind="buyer"
                :label="t('purchase-orders.buyer')"
            />
            <MasterLookup
                v-if="hasBusinessPermission(session.user, 'mitras.lookup')"
                id="report-mitra"
                v-model="mitraId"
                kind="mitra"
                :label="t('mitras.title')"
            />
            <MasterLookup
                v-if="hasBusinessPermission(session.user, 'graders.lookup')"
                id="report-grader"
                v-model="graderId"
                kind="grader"
                :label="t('graders.title')"
            />
            <MasterLookup
                v-if="hasBusinessPermission(session.user, 'timber-products.lookup')"
                id="report-timber"
                v-model="timberProductId"
                kind="timber"
                :label="t('timber-products.title')"
            />
        </div>
        <AppButton type="submit">{{ t('purchase-orders.apply') }}</AppButton>
    </form>
</template>
