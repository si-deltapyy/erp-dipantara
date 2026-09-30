import type { InjectionKey } from 'vue'
import type { PaymentsApi } from '@/core/types/payment'
export const paymentsApiKey: InjectionKey<PaymentsApi> = Symbol('payments-api')
