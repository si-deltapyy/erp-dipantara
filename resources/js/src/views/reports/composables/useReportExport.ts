import { computed, inject, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import type { ReportKind } from '@/core/types/report-export'
import type { ReportExportAttempt } from '@/stores/report-export-recovery'
import { useReportExportRecovery } from '@/stores/report-export-recovery'
import { reportsApiKey } from '@/api/reports-api'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { useDocumentContent } from '@/composables/useDocumentContent'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'
import { validatedReportRoute } from './report-route-query'
interface ReportExportState {
    readonly allowed: ComputedRef<boolean>
    readonly pending: ComputedRef<boolean>
    readonly error: ComputedRef<string>
    readonly hasDocument: ComputedRef<boolean>
    generate(): Promise<void>
    download(): Promise<void>
}
export function useReportExport(kind: () => ReportKind): ReportExportState {
    const configuredApi = inject(reportsApiKey)
    if (!configuredApi) throw new Error('Reports API is not configured')
    const api = configuredApi
    const route = useRoute()
    const store = useSessionStore()
    const session = useSession()
    const recovery = useReportExportRecovery()
    const generating = ref(false)
    const failure = ref('')
    let active: AbortController | undefined
    const identity = (): string => JSON.stringify([kind(), route.query])
    const allowed = computed(
        () =>
            hasBusinessPermission(store.user, 'reports.read') &&
            hasBusinessPermission(store.user, 'reports.export') &&
            hasBusinessPermission(store.user, 'documents.download') &&
            (kind() !== 'purchase_prices' ||
                (!!store.user?.permissions.includes('reports.read.all') &&
                    store.user.permissions.includes('timber-prices.read.all'))),
    )
    const content = useDocumentContent(identity, () => allowed.value)
    function synchronize(): void {
        active?.abort()
        generating.value = false
        failure.value = ''
        if (
            !allowed.value ||
            recovery.attempt?.actorId !== store.user?.id ||
            recovery.attempt?.identity !== identity()
        )
            recovery.$reset()
    }
    function attempt(): ReportExportAttempt {
        if (recovery.attempt && !recovery.attempt.document) return recovery.attempt
        const query = validatedReportRoute(route.query)
        return {
            actorId: store.user?.id ?? '',
            identity: identity(),
            idempotencyKey: crypto.randomUUID(),
            input: {
                kind: kind(),
                period: query.period,
                format: 'csv',
                filters: {
                    buyerId: query.buyerId,
                    mitraId: query.mitraId,
                    graderId: query.graderId,
                    timberProductId: query.timberProductId,
                    category: query.category,
                    search: query.search,
                    sort: query.sort,
                },
            },
        }
    }
    async function download(): Promise<void> {
        if (allowed.value && recovery.attempt?.document)
            await content.open(recovery.attempt.document, 'download')
    }
    async function generate(): Promise<void> {
        if (!allowed.value || generating.value || content.pendingId.value) return
        const request = new AbortController()
        active = request
        generating.value = true
        failure.value = ''
        try {
            const pending = attempt()
            recovery.attempt = pending
            const document = await api.export(pending.input, {
                signal: request.signal,
                idempotencyKey: pending.idempotencyKey,
            })
            if (request.signal.aborted) return
            recovery.attempt = { ...pending, document }
            await download()
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            failure.value = `reports.errors.${normalizeApiError(cause).kind}`
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) generating.value = false
        }
    }
    watch([identity, () => store.user, allowed], synchronize, { immediate: true, flush: 'sync' })
    onScopeDispose(() => active?.abort())
    return {
        allowed,
        pending: computed(() => generating.value || !!content.pendingId.value),
        error: computed(() => failure.value || content.error.value),
        hasDocument: computed(() => !!recovery.attempt?.document),
        generate,
        download,
    }
}
