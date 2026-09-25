import type { SessionUser } from '@/core/types/session'

export interface MitraTransactionLink {
    readonly mitraId: string
    readonly ownerUserId: string
    readonly assignedUserIds: readonly string[]
}

export const mitraTransactionFixtures: readonly MitraTransactionLink[] = [
    { mitraId: 'demo-mitra-01', ownerUserId: 'user-demo', assignedUserIds: ['grader-one'] },
    { mitraId: 'demo-mitra-02', ownerUserId: 'multiple-demo', assignedUserIds: ['grader-two'] },
]

export function canLookupMitra(
    mitraId: string,
    actor: SessionUser,
    links: readonly MitraTransactionLink[],
): boolean {
    if (actor.permissions.includes('mitras.lookup.all')) return true
    return links.some(
        (link) =>
            link.mitraId === mitraId &&
            ((actor.permissions.includes('mitras.lookup.own') && link.ownerUserId === actor.id) ||
                (actor.permissions.includes('mitras.lookup.assigned') &&
                    link.assignedUserIds.includes(actor.id))),
    )
}
