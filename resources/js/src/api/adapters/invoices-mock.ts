import type { InvoicesApi } from '@/core/types/invoice'
import type { SessionUser } from '@/core/types/session'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { ApiError } from '@/core/types/api-error'
import { parseInvoiceQuery } from '@/api/invoice-mapper'
import { invoiceFixtures } from '@/api/mocks/invoice-fixtures'
import { runDemoTransaction } from '@/api/mocks/persistence/transaction'
export function createMockInvoices(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
): InvoicesApi {
    return {
        list: (query, signal) =>
            runtime.executeBusiness('read', signal, async (active, _generation, scenario) => {
                const actor = getUser()
                if (!actor) throw new ApiError('unauthenticated')
                if (!hasBusinessPermission(actor, 'invoices.read')) throw new ApiError('forbidden')
                const filter = parseInvoiceQuery(query)
                return runDemoTransaction(
                    {},
                    ['purchase-orders'],
                    'readonly',
                    async (transaction) => {
                        const parents = new Map(
                            (await transaction.list('purchase-orders')).map((po) => [po.id, po]),
                        )
                        const matches = invoiceFixtures
                            .filter((invoice) => {
                                const parent = parents.get(invoice.purchaseOrderId)
                                return (
                                    parent &&
                                    (actor.permissions.includes('invoices.read.all') ||
                                        (actor.permissions.includes('invoices.read.own') &&
                                            parent.createdByUserId === actor.id)) &&
                                    (!filter.purchaseOrderId ||
                                        invoice.purchaseOrderId === filter.purchaseOrderId) &&
                                    (!filter.mitraId || invoice.mitraId === filter.mitraId) &&
                                    (!filter.direction || invoice.direction === filter.direction) &&
                                    (!filter.search ||
                                        invoice.number
                                            ?.toLowerCase()
                                            .includes(filter.search.toLowerCase()))
                                )
                            })
                            .sort((a, b) =>
                                filter.sort === 'createdAt'
                                    ? a.createdAt.localeCompare(b.createdAt)
                                    : b.createdAt.localeCompare(a.createdAt),
                            )
                        return {
                            data:
                                scenario === 'empty'
                                    ? []
                                    : matches.slice(
                                          (filter.page - 1) * filter.perPage,
                                          filter.page * filter.perPage,
                                      ),
                            meta: {
                                page: filter.page,
                                perPage: filter.perPage,
                                total: scenario === 'empty' ? 0 : matches.length,
                            },
                        }
                    },
                    active,
                )
            }),
    }
}
