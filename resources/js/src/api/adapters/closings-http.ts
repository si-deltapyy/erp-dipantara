import type { AxiosInstance } from 'axios'
import type { ClosingsApi } from '@/core/types/closing'
import { createHttpClient } from '@/services/http-client'
import { parseDetail } from '@/api/contracts/response-parsers'
import { parseId } from '@/api/contracts/value-parsers'
import { parseClosingEligibility } from '@/api/closing-mapper'
export function createHttpClosings(client: AxiosInstance = createHttpClient()): ClosingsApi {
    return {
        async eligibility(id, signal) {
            return parseDetail(
                (
                    await client.get<unknown>(
                        `/api/v1/purchase-orders/${encodeURIComponent(parseId(id))}/closing-eligibility`,
                        { signal },
                    )
                ).data,
                parseClosingEligibility,
            ).data
        },
        subscribe: () => () => undefined,
    }
}
