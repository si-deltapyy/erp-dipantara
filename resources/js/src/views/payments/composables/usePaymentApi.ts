import { inject } from 'vue'
import { paymentsApiKey } from '@/api/payments-api'
import type { PaymentsApi } from '@/core/types/payment'
export function usePaymentApi(): PaymentsApi {
    const api = inject(paymentsApiKey)
    if (!api) throw new Error('Purchase delivery API is not configured')
    return api
}
