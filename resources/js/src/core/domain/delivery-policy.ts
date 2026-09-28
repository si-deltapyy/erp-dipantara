import type { Delivery } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
export function canCreateDelivery(user: SessionUser | null): boolean {
    return !!user?.permissions.includes('deliveries.create.all')
}
export function canActOnDelivery(
    user: SessionUser | null,
    delivery: Delivery,
    action: 'update' | 'dispatch' | 'receive',
): boolean {
    return (
        (action === 'receive' ? delivery.status === 'dispatched' : delivery.status === 'draft') &&
        delivery.allowedActions.includes(action) &&
        !!user?.permissions.includes(`deliveries.${action}.all`)
    )
}
