import type { Invoice, InvoiceQuery } from '@/core/types/invoice'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { InvoiceMutation } from './invoice-mutation'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { parseInvoiceQuery } from '@/api/invoice-mapper'
import { parseInvoiceInput, parseInvoiceVersion } from '@/api/contracts/invoice-input'
import { evaluateRecordAccess, assertRecordAccess } from '@/core/domain/record-policy'
import { requireInvoicePermission, presentInvoice } from './invoice-policy'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { hashMutationPayload } from './idempotency'
import { writeInvoice } from './invoice-mutation'
const stores: readonly DemoStore[] = [
    'metadata',
    'invoices',
    'purchase-orders',
    'assignments',
    'orders',
    'mitras',
    'documents',
]
export class InvoiceRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: InvoiceQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Invoice>> {
        const actor = requireInvoicePermission(user, 'read')
        const filter = parseInvoiceQuery(query)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('invoices'))
                    .filter(
                        (invoice) =>
                            evaluateRecordAccess(actor, 'invoices.read', invoice) === 'allowed' &&
                            (!filter.purchaseOrderId ||
                                filter.purchaseOrderId === invoice.purchaseOrderId) &&
                            (!filter.direction || filter.direction === invoice.direction) &&
                            (!filter.mitraId || filter.mitraId === invoice.mitraId) &&
                            [
                                invoice.number ?? '',
                                invoice.purchaseOrderNumber,
                                invoice.counterpartyName,
                            ].some((label) => label.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort(
                        (a, b) =>
                            (filter.sort === 'createdAt' ? 1 : -1) *
                            (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
                    )
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((invoice) => presentInvoice(invoice, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Invoice> {
        const actor = requireInvoicePermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const invoice = await transaction.get('invoices', id)
                if (!invoice) throw new ApiError('not-found')
                assertRecordAccess(actor, 'invoices.read', invoice)
                return presentInvoice(invoice, actor, metadata.generation)
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<InvoiceMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Invoice> {
        const actor = requireInvoicePermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'issue'
                ? parseInvoiceVersion(mutation.input)
                : parseInvoiceInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...stores, 'invoiceMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentInvoice(
                    await writeInvoice(transaction, metadata, actor, { ...mutation, input, hash }),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
