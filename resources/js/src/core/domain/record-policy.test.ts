import { expect, it } from 'vitest'
import type { SessionUser } from '@/core/types/session'
import { canReadPrices, evaluateRecordAccess, hasBusinessPermission } from './record-policy'

const actor = (permissions: readonly string[]): SessionUser => ({
    id: 'actor',
    displayName: 'Demo',
    roles: ['admin', 'future-role'],
    permissions,
    developmentCapabilities: [],
})
const record = { createdByUserId: 'other', submittedByUserId: 'submitter', graderUserId: 'grader' }
it('denies by default and never grants access from a role name', () => {
    expect(evaluateRecordAccess(actor([]), 'gradings.read', record)).toBe('forbidden')
    expect(hasBusinessPermission(null, 'gradings.read')).toBe(false)
    expect(hasBusinessPermission(actor(['manage gradings']), 'gradings.read')).toBe(false)
    expect(hasBusinessPermission(actor(['gradings.read.own']), 'gradings.read')).toBe(false)
})
it('distinguishes unavailable scope from a missing operation permission', () => {
    expect(evaluateRecordAccess(actor(['gradings.read.assigned']), 'gradings.read', record)).toBe(
        'not-found',
    )
    expect(
        evaluateRecordAccess(actor(['gradings.read.assigned']), 'gradings.read', {
            ...record,
            graderUserId: 'actor',
        }),
    ).toBe('allowed')
    expect(evaluateRecordAccess(actor(['gradings.read.all']), 'gradings.read', record)).toBe(
        'allowed',
    )
})
it('uses parent ownership where the domain explicitly resolves it', () => {
    const user = actor(['invoices.read.own'])
    expect(evaluateRecordAccess(user, 'invoices.read', record)).toBe('not-found')
    expect(evaluateRecordAccess(user, 'invoices.read', { ...record, ownerUserId: 'actor' })).toBe(
        'allowed',
    )
})
it('unions explicit scopes without granting price access implicitly', () => {
    const user = actor(['gradings.read.assigned', 'gradings.read.all'])
    expect(evaluateRecordAccess(user, 'gradings.read', record)).toBe('allowed')
    expect(canReadPrices(user)).toBe(false)
    expect(canReadPrices(actor(['timber-prices.read.all']))).toBe(true)
})
it.each(['approve', 'reject'] as const)(
    'denies self %s for either creator or submitter regardless of scopes',
    (action) => {
        const user = actor([`gradings.${action}.all`, `gradings.${action}.assigned`])
        expect(evaluateRecordAccess(user, `gradings.${action}`, record)).toBe('allowed')
        expect(
            evaluateRecordAccess(user, `gradings.${action}`, {
                ...record,
                createdByUserId: 'actor',
            }),
        ).toBe('forbidden')
        expect(
            evaluateRecordAccess(user, `gradings.${action}`, {
                ...record,
                submittedByUserId: 'actor',
            }),
        ).toBe('forbidden')
    },
)
