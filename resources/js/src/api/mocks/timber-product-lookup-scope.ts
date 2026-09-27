import type { SessionUser } from '@/core/types/session'

export interface TimberProductTransactionLink {
    readonly timberProductId: string
    readonly graderUserId: string
}
export const timberProductTransactionFixtures: readonly TimberProductTransactionLink[] = [
    { timberProductId: 'demo-timber-01', graderUserId: 'grader-one' },
    { timberProductId: 'demo-timber-02', graderUserId: 'grader-two' },
]
export function canLookupTimberProduct(
    id: string,
    actor: SessionUser,
    links: readonly TimberProductTransactionLink[],
): boolean {
    if (
        actor.permissions.includes('timber-products.lookup.all') ||
        actor.permissions.includes('timber-products.lookup.own')
    )
        return true
    return (
        actor.permissions.includes('timber-products.lookup.assigned') &&
        links.some((link) => link.timberProductId === id && link.graderUserId === actor.id)
    )
}
