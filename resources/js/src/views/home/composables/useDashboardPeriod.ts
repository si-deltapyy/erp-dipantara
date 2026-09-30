import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseProductionPeriod } from '@/api/production-mapper'
export function useDashboardPeriod(): {
    period: Ref<string>
    error: Ref<string>
    applyPeriod(): Promise<void>
} {
    const route = useRoute()
    const router = useRouter()
    const period = ref('')
    const error = ref('')
    watch(
        () => route.query.period,
        (value) => {
            period.value =
                typeof value === 'string'
                    ? value
                    : new Date()
                          .toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
                          .slice(0, 7)
            error.value = ''
        },
        { immediate: true },
    )
    async function applyPeriod(): Promise<void> {
        try {
            parseProductionPeriod(period.value)
        } catch {
            error.value = 'production.invalidPeriod'
            return
        }
        error.value = ''
        await router.replace({ query: { ...route.query, period: period.value } })
    }
    return { period, error, applyPeriod }
}
