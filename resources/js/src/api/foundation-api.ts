import type { FoundationApi } from '@/core/types/foundation'

export function createFoundationApi(adapter: FoundationApi): FoundationApi {
    return { list: (request) => adapter.list(request) }
}
