import type { AxiosInstance } from 'axios'
import type { PaymentsApi } from '@/core/types/payment'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parsePaymentRecord } from '@/api/payment-mapper'
import { parseCollection } from '@/api/contracts/response-parsers'

export function createHttpPayments(client: AxiosInstance = createHttpClient()): PaymentsApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/logs-payments', { signal })
            return parseCollection(response.data, parsePaymentRecord)
        },
        get: unavailable,
        create: unavailable,
        update: unavailable,
        submit: unavailable,
        approve: unavailable,
        reject: unavailable,
        subscribe: () => () => undefined,
    }
}
