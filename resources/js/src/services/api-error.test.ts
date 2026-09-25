import { AxiosError } from 'axios'
import { expect, test } from 'vitest'
import { normalizeApiError } from './api-error'
function failure(status: number, body: unknown): AxiosError {
    const error = new AxiosError('Request failed')
    error.response = {
        status,
        data: body,
        statusText: '',
        headers: {},
        config: { headers: {} },
    } as AxiosError['response']
    return error
}
test('preserves Laravel validation fields and discards malformed errors', () => {
    expect(
        normalizeApiError(
            failure(422, { errors: { email: ['Rejected'], password: ['Required'], broken: 42 } }),
        ),
    ).toMatchObject({
        kind: 'validation',
        fieldErrors: { email: ['Rejected'], password: ['Required'] },
    })
})
test('distinguishes expired CSRF, authentication, and rate limiting', () => {
    expect(normalizeApiError(failure(419, {})).kind).toBe('csrf')
    expect(normalizeApiError(failure(401, {})).kind).toBe('unauthenticated')
    expect(normalizeApiError(failure(429, {})).kind).toBe('rate-limited')
})

test('retains business error identifiers without requiring them on Breeze responses', () => {
    expect(
        normalizeApiError(failure(409, { code: 'version_conflict', requestId: 'demo-request' })),
    ).toMatchObject({ kind: 'conflict', code: 'version_conflict', requestId: 'demo-request' })
    expect(normalizeApiError(failure(419, {})).code).toBeUndefined()
    expect(normalizeApiError(failure(422, { code: 12, requestId: {} })).requestId).toBeUndefined()
})
