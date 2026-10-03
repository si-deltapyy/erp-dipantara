import type { AxiosInstance } from 'axios'
import type { BuyerInput, BuyerWriteOptions, BuyerRecord, BuyersApi } from '@/core/types/buyer'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { mapApiFieldErrors } from '@/services/api-error'
import { parseBuyerInput } from '@/api/buyer-mapper'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
import { parseBuyerRecord } from '@/api/buyer-mapper'

export function createHttpBuyers(client: AxiosInstance = createHttpClient()): BuyersApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    async function write(
        input: BuyerInput,
        options: BuyerWriteOptions,
        id?: string,
    ): Promise<BuyerRecord> {
        const buyer = parseBuyerInput(input)
        try {
            const response = await client.request<unknown>({
                method: id ? 'put' : 'post',
                url: id ? `/api/v1/buyers/${encodeURIComponent(id)}` : '/api/v1/buyers',
                data: {
                    company_name: buyer.companyName,
                    pic_name: buyer.contactName,
                    phone_number: buyer.phone,
                    address: buyer.address,
                },
                signal: options.signal,
            })
            return parseDetail(response.data, parseBuyerRecord).data
        } catch (cause) {
            const fields: Readonly<Record<string, string>> = {
                company_name: 'companyName',
                pic_name: 'contactName',
                phone_number: 'phone',
            }
            throw mapApiFieldErrors(cause, fields)
        }
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/buyers', { signal })
            return parseCollection(response.data, parseBuyerRecord)
        },
        lookup: unavailable,
        async get(id, signal) {
            const response = await client.get<unknown>(`/api/v1/buyers/${encodeURIComponent(id)}`, {
                signal,
            })
            return parseDetail(response.data, parseBuyerRecord).data
        },
        create: (input, options) => write(input, options),
        update: (id, input, options) => write(input, options, id),
        subscribe: () => () => undefined,
    }
}
