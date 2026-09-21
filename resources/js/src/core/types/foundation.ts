export interface FoundationRecord {
    readonly id: string
    readonly label: string
}

export type MockScenario =
    | 'success'
    | 'empty'
    | 'validation'
    | 'unauthenticated'
    | 'forbidden'
    | 'not-found'
    | 'conflict'
    | 'network'
    | 'unexpected'
    | 'slow'

export interface FoundationRequest {
    readonly scenario: MockScenario
    readonly signal: AbortSignal
}

export interface FoundationApi {
    list(request: FoundationRequest): Promise<readonly FoundationRecord[]>
}
