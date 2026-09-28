import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Invoice } from '@/core/types/invoice'
import { useInvoiceApi } from './useInvoiceApi'
import { useRecordDetail } from '@/composables/useRecordDetail'
export function useInvoiceVersions(identity: () => string): {
    versions: ComputedRef<readonly Invoice[]>
    loading: Ref<boolean>
    error: Ref<string>
    refresh(): Promise<void>
} {
    const api = useInvoiceApi()
    const { record, loading, error, refresh } = useRecordDetail(
        { get: api.versions, subscribe: api.subscribe },
        'invoices',
        false,
        identity,
    )
    return { versions: computed(() => record.value ?? []), loading, error, refresh }
}
