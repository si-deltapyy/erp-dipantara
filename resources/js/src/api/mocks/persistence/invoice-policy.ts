import type { Invoice } from '@/core/types/invoice'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { hasBusinessPermission } from '@/core/domain/record-policy'
export function requireInvoicePermission(
    user: SessionUser | null,
    action: 'read' | 'create' | 'update' | 'issue',
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(user, `invoices.${action}`)) throw new ApiError('forbidden')
    return user
}
export function presentInvoice(invoice: Invoice, actor: SessionUser, generation: string): Invoice {
    return {
        ...invoice,
        snapshotGeneration: generation,
        allowedActions: ['update', 'issue'].filter(
            (action) =>
                invoice.status === 'draft' && actor.permissions.includes(`invoices.${action}.all`),
        ),
    }
}
