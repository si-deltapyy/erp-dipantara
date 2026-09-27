import { expect, test } from 'vitest'
import { canLookupMitra, mitraTransactionFixtures } from './mitra-lookup-scope'
import type { SessionUser } from '@/core/types/session'

const actor: SessionUser = {
    id: 'user-demo',
    displayName: 'Synthetic User',
    roles: ['admin'],
    permissions: ['mitras.lookup.own'],
    developmentCapabilities: [],
}

test('restricts lookup to related transactions without a role bypass', () => {
    expect(canLookupMitra('demo-mitra-01', actor, mitraTransactionFixtures)).toBe(true)
    expect(canLookupMitra('demo-mitra-02', actor, mitraTransactionFixtures)).toBe(false)
    expect(
        canLookupMitra('demo-mitra-01', { ...actor, permissions: [] }, mitraTransactionFixtures),
    ).toBe(false)
    expect(canLookupMitra('demo-mitra-01', actor, [])).toBe(false)
})

test('uses explicit assigned and all permissions independently', () => {
    const grader = { ...actor, id: 'grader-one', permissions: ['mitras.lookup.assigned'] }
    expect(canLookupMitra('demo-mitra-01', grader, mitraTransactionFixtures)).toBe(true)
    expect(canLookupMitra('demo-mitra-02', grader, mitraTransactionFixtures)).toBe(false)
    expect(
        canLookupMitra('demo-mitra-24', { ...actor, permissions: ['mitras.lookup.all'] }, []),
    ).toBe(true)
})
