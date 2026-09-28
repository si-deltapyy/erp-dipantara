import type { Invoice } from '@/core/types/invoice'
import type { SessionUser } from '@/core/types/session'
export function canCreateInvoice(user: SessionUser | null): boolean {
    return !!user?.permissions.includes('invoices.create.all')
}
export function canActOnInvoice(
    user: SessionUser | null,
    invoice: Invoice,
    action: 'update' | 'issue',
): boolean {
    return (
        invoice.status === 'draft' &&
        invoice.allowedActions.includes(action) &&
        !!user?.permissions.includes(`invoices.${action}.all`)
    )
}
