import { ApiError } from '@/core/types/api-error'
import type { FoundationApi } from '@/core/types/foundation'
import { waitForMock } from '@/api/mocks/delay'
import { foundationRecords } from '@/api/mocks/foundation-fixtures'

export function createFoundationMock(): FoundationApi {
    return {
        async list({ scenario, signal }) {
            await waitForMock(scenario === 'slow' ? 1800 : 250, signal)
            if (scenario === 'empty') return []
            if (scenario === 'success' || scenario === 'slow') {
                return foundationRecords.map((record) => ({ ...record }))
            }
            if (scenario === 'validation') {
                throw new ApiError('validation', { scenario: ['invalid-selection'] })
            }
            throw new ApiError(scenario)
        },
    }
}
