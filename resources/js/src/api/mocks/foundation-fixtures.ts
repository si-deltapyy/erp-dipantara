import type { FoundationRecord, MockScenario } from '@/core/types/foundation'

export const foundationRecords: readonly FoundationRecord[] = [
    { id: 'sample-001', label: 'Sampel sintetis 001' },
    { id: 'sample-002', label: 'Sampel sintetis 002' },
    { id: 'sample-003', label: 'Sampel sintetis 003' },
]

export const mockScenarios: readonly MockScenario[] = [
    'success',
    'empty',
    'validation',
    'unauthenticated',
    'forbidden',
    'not-found',
    'conflict',
    'network',
    'unexpected',
    'slow',
]
