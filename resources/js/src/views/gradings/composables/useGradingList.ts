import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gradingStatuses } from '@/core/types/grading'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useMasterList } from '@/composables/useMasterList'
import { useGradingApi } from './useGradingApi'
export function useGradingList(): ReturnType<typeof createGradingList> {
    return createGradingList()
}
function createGradingList() {
    const api = useGradingApi(),
        route = useRoute(),
        router = useRouter(),
        session = useSessionStore()
    const filters = computed(() => ({
        status: gradingStatuses.find((status) => status === route.query.status),
        assignmentId:
            typeof route.query.assignmentId === 'string' && route.query.assignmentId.length <= 100
                ? route.query.assignmentId
                : undefined,
    }))
    const state = useMasterList(
        {
            list: (query, signal) => api.list({ ...query, ...filters.value }, signal),
            subscribe: api.subscribe,
        },
        'gradings',
    )
    const status = ref(filters.value.status ?? ''),
        assignmentId = ref(filters.value.assignmentId ?? '')
    watch(filters, () => {
        status.value = filters.value.status ?? ''
        assignmentId.value = filters.value.assignmentId ?? ''
        void state.refresh()
    })
    async function applyFilters(): Promise<void> {
        await router.replace({
            query: {
                search: state.search.value.trim() || undefined,
                status: status.value || undefined,
                assignmentId: assignmentId.value.trim() || undefined,
            },
        })
    }
    const canReview = computed(
        () =>
            hasBusinessPermission(session.user, 'gradings.approve') ||
            hasBusinessPermission(session.user, 'gradings.reject'),
    )
    return { ...state, status, assignmentId, canReview, applyFilters }
}
