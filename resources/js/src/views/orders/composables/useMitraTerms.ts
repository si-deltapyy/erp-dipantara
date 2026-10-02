import { ref, shallowRef, watch } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { Invoice } from '@/core/types/invoice'

interface MitraTermsState {
    invoices: ShallowRef<readonly Invoice[]>
    error: Ref<string>
    loading: Ref<boolean>
    hasMore: Ref<boolean>
    load(more?: boolean): Promise<void>
}
export function useMitraTerms(
    parent: Readonly<Ref<{ purchaseOrderId: string; mitraId: string }>>,
): MitraTermsState {
    const invoices = shallowRef<readonly Invoice[]>([])
    const error = ref('ui.featureUnavailable')
    const loading = ref(false)
    const hasMore = ref(false)
    async function load(): Promise<void> {
        error.value = 'ui.featureUnavailable'
    }
    watch(parent, () => void load())
    return { invoices, error, loading, hasMore, load }
}
