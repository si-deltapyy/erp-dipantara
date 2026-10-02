import { useRecordDetail } from '@/composables/useRecordDetail'
import { useDeliveryApi } from './useDeliveryApi'
import type { Delivery } from '@/core/types/delivery'

export function useDeliveryList(): ReturnType<typeof useRecordDetail<readonly Delivery[]>> {
    const api = useDeliveryApi()
    return useRecordDetail(
        {
            get: (_id, signal) =>
                api.list({ page: 1, perPage: 20, search: '', sort: '-createdAt' }, signal),
            subscribe: api.subscribe,
        },
        'deliveries',
        true,
        () => 'deliveries',
    )
}
