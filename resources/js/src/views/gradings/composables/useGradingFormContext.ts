import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useRoute } from 'vue-router'
import type { Assignment } from '@/core/types/assignment'
import type { Grading } from '@/core/types/grading'
import { useGradingApi } from './useGradingApi'
import { useAssignmentApi } from '@/views/orders/composables/useAssignmentApi'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { ApiError } from '@/core/types/api-error'
interface FormContext {
    grading: ShallowRef<Grading | undefined>
    assignment: ShallowRef<Assignment | undefined>
    loading: Ref<boolean>
    error: Ref<string>
    permitted: ComputedRef<boolean>
    refresh(): Promise<void>
}
export function useGradingFormContext(): FormContext {
    const route = useRoute(),
        session = useSession(),
        store = useSessionStore()
    const api = useGradingApi(),
        assignments = useAssignmentApi()
    const grading = shallowRef<Grading>(),
        assignment = shallowRef<Assignment>()
    const loading = ref(false),
        error = ref('')
    let active: AbortController | undefined
    async function refresh(): Promise<void> {
        active?.abort()
        const request = new AbortController()
        active = request
        grading.value = undefined
        assignment.value = undefined
        error.value = ''
        loading.value = true
        try {
            const record =
                typeof route.params.id === 'string'
                    ? await api.get(route.params.id, request.signal)
                    : undefined
            const id = record?.assignmentId ?? route.query.assignmentId
            if (typeof id !== 'string') throw new ApiError('not-found')
            const context = await assignments.get(id, request.signal)
            if (!request.signal.aborted) {
                grading.value = record
                assignment.value = context
            }
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            error.value = `gradings.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) loading.value = false
        }
    }
    watch(
        () => [route.params.id, route.query.assignmentId, store.user],
        () => void refresh(),
        { immediate: true },
    )
    onScopeDispose(() => active?.abort())
    const permitted = computed(
        () =>
            !!assignment.value &&
            (grading.value
                ? canActOnGrading(
                      store.user,
                      grading.value,
                      route.name === 'grading-revise' ? 'revise' : 'update',
                  )
                : assignment.value.allowedActions.includes('create-grading') &&
                  evaluateRecordAccess(store.user, 'gradings.create', assignment.value) ===
                      'allowed'),
    )
    return { grading, assignment, loading, error, permitted, refresh }
}
