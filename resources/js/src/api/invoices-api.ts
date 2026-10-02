import type { InjectionKey } from 'vue'
import type { InvoicesApi } from '@/core/types/invoice'
export const invoicesApiKey: InjectionKey<InvoicesApi> = Symbol('invoices-api')
