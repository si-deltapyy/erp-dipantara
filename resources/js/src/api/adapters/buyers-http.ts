import type { AxiosInstance } from 'axios'
import type { BuyersApi } from '@/core/types/buyer'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { normalizeApiError } from '@/services/api-error'
import { parseBuyerInput } from '@/api/buyer-mapper'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
import { parseBuyerRecord } from '@/api/buyer-mapper'

export function createHttpBuyers(client: AxiosInstance = createHttpClient()): BuyersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/buyers', { signal })
            return parseCollection(response.data, parseBuyerRecord)
        },
        lookup: unavailable,
        get: unavailable,
        async create(input, options) {
            const buyer = parseBuyerInput(input)
            try {
                const response = await client.post<unknown>(
                    '/api/v1/buyers',
                    {
                        company_name: buyer.companyName,
                        pic_name: buyer.contactName,
                        phone_number: buyer.phone,
                        address: buyer.address,
                    },
                    { signal: options.signal },
                )
                return parseDetail(response.data, parseBuyerRecord).data
            } catch (cause) {
                const failure = normalizeApiError(cause)
                const fields: Readonly<Record<string, string>> = {
                    company_name: 'companyName',
                    pic_name: 'contactName',
                    phone_number: 'phone',
                }
                throw new ApiError(
                    failure.kind,
                    Object.fromEntries(
                        Object.entries(failure.fieldErrors).map(([field, messages]) => [
                            fields[field] ?? field,
                            messages,
                        ]),
                    ),
                    failure.code,
                    failure.requestId,
                )
            }
        },
        update: unavailable,
        subscribe: () => () => undefined,
    }
}
