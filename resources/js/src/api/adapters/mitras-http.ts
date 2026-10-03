import type { AxiosInstance } from 'axios'
import type { MitraInput, MitraWriteOptions, MitraRecord, MitrasApi } from '@/core/types/mitra'
import { ApiError } from '@/core/types/api-error'
import { mapApiFieldErrors } from '@/services/api-error'
import { createHttpClient } from '@/services/http-client'
import { parseCollection, parseDetail } from '@/api/contracts/response-parsers'
import { parseMitraRecord, parseMitraInput } from '@/api/mitra-mapper'

export function createHttpMitras(client: AxiosInstance = createHttpClient()): MitrasApi {
    const unavailable = async (): Promise<never> => {
        throw new ApiError('unexpected', {}, 'feature.unavailable')
    }
    async function write(
        input: MitraInput,
        options: MitraWriteOptions,
        id?: string,
    ): Promise<MitraRecord> {
        const mitra = parseMitraInput(input)
        try {
            const response = await client.request<unknown>({
                method: id ? 'put' : 'post',
                url: id ? `/api/v1/mitras/${encodeURIComponent(id)}` : '/api/v1/mitras',
                data: {
                    name: mitra.name,
                    phone_number: mitra.phone,
                    address: mitra.address,
                    grader_group: mitra.graderGroup,
                },
                signal: options.signal,
            })
            return parseDetail(response.data, parseMitraRecord).data
        } catch (cause) {
            const fields: Readonly<Record<string, string>> = {
                phone_number: 'phone',
                grader_group: 'graderGroup',
            }
            throw mapApiFieldErrors(cause, fields)
        }
    }
    return {
        async list(_query, signal) {
            const response = await client.get<unknown>('/api/v1/mitras', { signal })
            return parseCollection(response.data, parseMitraRecord)
        },
        lookup: unavailable,
        get: unavailable,
        create: (input, options) => write(input, options),
        update: (id, input, options) => write(input, options, id),
        subscribe: () => () => undefined,
    }
}
