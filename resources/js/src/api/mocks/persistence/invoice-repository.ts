import type { PurchaseOrderInvoiceSummary } from '@/core/types/invoice-summary'
import { purchaseOrderInvoiceSummary } from './invoice-summary'
import { approvedPaymentCredit } from './payment-credit'
import type { InvoiceSettlement } from '@/core/types/invoice-settlement'
import { invoiceSettlement } from './invoice-monitoring'
import { invoiceOutstanding, normalizeIssuedInvoice } from './invoice-settlement'
import type { InvoiceCreditResolver } from './invoice-settlement'
import type { Invoice, InvoiceQuery } from '@/core/types/invoice'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { InvoiceMutation } from './invoice-mutation'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { parseInvoiceQuery } from '@/api/invoice-mapper'
import {
    parseInvoiceInput,
    parseInvoiceVersion,
    parseInvoiceRevision,
} from '@/api/contracts/invoice-input'
import { evaluateRecordAccess, assertRecordAccess } from '@/core/domain/record-policy'
import { requireInvoicePermission, presentInvoice } from './invoice-policy'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { hashMutationPayload } from './idempotency'
import { writeInvoice } from './invoice-mutation'
const stores: readonly DemoStore[] = [
    'metadata',
    'invoices',
    'payments',
    'invoiceVersions',
    'purchase-orders',
    'assignments',
    'orders',
    'mitras',
    'documents',
]
export class InvoiceRepository {
    constructor(
        private readonly options: DatabaseOptions = {},
        private readonly credits: InvoiceCreditResolver = approvedPaymentCredit,
    ) {}
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
                    .map(normalizeIssuedInvoice)
                    .filter(
                        (invoice) =>
                            evaluateRecordAccess(actor, 'invoices.read', invoice) === 'allowed' &&
                            (!filter.purchaseOrderId ||
                                filter.purchaseOrderId === invoice.purchaseOrderId) &&
                            (!filter.direction || filter.direction === invoice.direction) &&
                            (!filter.status || filter.status === invoice.status) &&
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
                    data: await Promise.all(
                        matches
                            .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                            .map(async (invoice) =>
                                presentInvoice(
                                    invoiceOutstanding(
                                        invoice,
                                        await this.credits(transaction, invoice.id),
                                    ),
                                    actor,
                                    metadata.generation,
                                ),
                            ),
                    ),
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
                return presentInvoice(
                    invoiceOutstanding(
                        normalizeIssuedInvoice(invoice),
                        await this.credits(transaction, invoice.id),
                    ),
                    actor,
                    metadata.generation,
                )
            },
            signal,
        )
    }
    async summary(
        user: SessionUser | null,
        purchaseOrderId: string,
        signal: AbortSignal,
    ): Promise<PurchaseOrderInvoiceSummary> {
        const actor = requireInvoicePermission(user, 'read')
        parseId(purchaseOrderId)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                const parent = await transaction.get('purchase-orders', purchaseOrderId)
                if (!parent) throw new ApiError('not-found')
                assertRecordAccess(actor, 'invoices.read', parent)
                return purchaseOrderInvoiceSummary(
                    transaction,
                    actor,
                    purchaseOrderId,
                    this.credits,
                )
            },
            signal,
        )
    }
    async settlement(
        user: SessionUser | null,
        id: string,
        signal: AbortSignal,
    ): Promise<InvoiceSettlement> {
        const actor = requireInvoicePermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                const stored = await transaction.get('invoices', id)
                if (!stored) throw new ApiError('not-found')
                assertRecordAccess(actor, 'invoices.read', stored)
                return invoiceSettlement(
                    transaction,
                    normalizeIssuedInvoice(stored),
                    await this.credits(transaction, id),
                )
            },
            signal,
        )
    }
    async versions(
        user: SessionUser | null,
        id: string,
        signal: AbortSignal,
    ): Promise<readonly Invoice[]> {
        const actor = requireInvoicePermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const current = await transaction.get('invoices', id)
                if (!current) throw new ApiError('not-found')
                assertRecordAccess(actor, 'invoices.read', current)
                const versions = (await transaction.list('invoiceVersions'))
                    .filter(
                        (version) =>
                            version.invoiceId === id &&
                            version.invoice.revisionNumber !== current.revisionNumber,
                    )
                    .map((version) => ({
                        ...normalizeIssuedInvoice(version.invoice),
                        allowedActions: [],
                    }))
                return [
                    ...versions,
                    presentInvoice(normalizeIssuedInvoice(current), actor, metadata.generation),
                ].sort((a, b) => b.revisionNumber - a.revisionNumber)
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
            mutation.action === 'revise'
                ? parseInvoiceRevision(mutation.input)
                : mutation.action === 'issue'
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
                    await writeInvoice(
                        transaction,
                        metadata,
                        actor,
                        { ...mutation, input, hash },
                        await this.credits(transaction, mutation.id ?? ''),
                    ),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
