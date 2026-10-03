import type { AxiosInstance } from 'axios'
import type { DeliveriesApi } from '@/core/types/delivery'
import { ApiError } from '@/core/types/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseDeliveryRecord } from '@/api/delivery-mapper'
import { mapApiFieldErrors } from '@/services/api-error'
import { parseNumericId, parseObject } from '@/api/contracts/value-parsers'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'

export function createHttpDeliveries(client: AxiosInstance = createHttpClient()): DeliveriesApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/logs-deliveries', { signal })
            return parseCollection(response.data, parseDeliveryRecord)
        },
        get: unavailable,
        async create(input, options) {
            try {
                const response = await client.post<unknown>(
                    '/api/v1/logs-deliveries',
                    {
                        pre_order_id: input.purchaseOrderId,
                        mitra_id: input.mitraId,
                        grader_id: input.graderId,
                        delivery_date: input.deliveryDate,
                        car_plate_number: input.licensePlate.trim(),
                        SAKR_number_to_buyer: input.buyerSakrNumber.trim(),
                        SAKR_number_to_company: input.companySakrNumber.trim(),
                        delivery_status: input.status,
                        note: input.notes.trim() || null,
                    },
                    { signal: options.signal },
                )
                return {
                    id: parseDetail(response.data, (value) =>
                        parseNumericId(parseObject(value, 'delivery').id),
                    ).data,
                }
            } catch (cause) {
                const fields: Readonly<Record<string, string>> = {
                    pre_order_id: 'purchaseOrderId',
                    mitra_id: 'mitraId',
                    grader_id: 'graderId',
                    delivery_date: 'deliveryDate',
                    car_plate_number: 'licensePlate',
                    SAKR_number_to_buyer: 'buyerSakrNumber',
                    SAKR_number_to_company: 'companySakrNumber',
                    delivery_status: 'status',
                    note: 'notes',
                }
                throw mapApiFieldErrors(cause, fields)
            }
        },
        update: unavailable,
        availability: unavailable,
        dispatch: unavailable,
        receive: unavailable,
        subscribe: () => () => undefined,
    }
}
