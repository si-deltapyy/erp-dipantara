import { useRecordDetail } from '@/composables/useRecordDetail'
import type { OrderDetail } from '@/core/types/order'
import { useOrderApi } from './useOrderApi'
export function useOrderDetail(): Omit<
    ReturnType<typeof useRecordDetail<OrderDetail>>,
    'record'
> & { order: ReturnType<typeof useRecordDetail<OrderDetail>>['record'] } {
    const { record: order, ...state } = useRecordDetail(useOrderApi(), 'orders')
    return { ...state, order }
}
